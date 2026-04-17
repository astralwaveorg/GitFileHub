import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '@/lib/db';
import { gitPull } from '@/lib/git';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { decrypt } from '@/lib/crypto';

// Store active cron jobs for cleanup
const activeJobs: Map<string, ScheduledTask> = new Map();

function getIntervalCron(intervalMinutes: number): string | null {
  switch (intervalMinutes) {
    case 30: return '*/30 * * * *';
    case 60: return '0 * * * *';
    case 120: return '0 */2 * * *';
    case 240: return '0 */4 * * *';
    default: return null;
  }
}

async function syncRepo(repoId: string, localPath: string, sshKeyId: string) {
  const sshKey = await prisma.sSHKey.findUnique({ where: { id: sshKeyId } });
  if (!sshKey) return;

  const sshKeyPath = path.join(os.tmpdir(), `gfd-cron-${repoId}`);
  try {
    const privateKey = decrypt(sshKey.privateKey);
    await fs.writeFile(sshKeyPath, privateKey, { mode: 0o600 });
    await gitPull(localPath, sshKeyPath);
    console.log(`[Scheduler] Synced repo ${repoId}`);
  } catch (error) {
    console.error(`[Scheduler] Failed to sync repo ${repoId}:`, error);
  } finally {
    try { await fs.unlink(sshKeyPath); } catch {}
  }
}

// Initialize scheduled tasks
export async function startScheduler() {
  const repos = await prisma.repo.findMany({
    where: { autoPullInterval: { gt: 0 } },
  });

  for (const repo of repos) {
    const cronExpr = getIntervalCron(repo.autoPullInterval);
    if (!cronExpr) continue;

    const job = cron.schedule(cronExpr, async () => {
      // Query fresh repo data each time to avoid stale closure capture
      const freshRepo = await prisma.repo.findUnique({ where: { id: repo.id } });
      if (!freshRepo) {
        stopRepoSchedule(repo.id);
        return;
      }
      await syncRepo(freshRepo.id, freshRepo.localPath, freshRepo.sshKeyId);
    });

    activeJobs.set(repo.id, job);
    console.log(`[Scheduler] Started auto-sync for repo "${repo.name}" (every ${repo.autoPullInterval} min)`);
  }
}

// Update scheduler when repo config changes
export async function updateRepoSchedule(repoId: string) {
  // Stop existing job
  const existingJob = activeJobs.get(repoId);
  if (existingJob) {
    existingJob.stop();
    activeJobs.delete(repoId);
  }

  // Start new job if needed
  const repo = await prisma.repo.findUnique({ where: { id: repoId } });
  if (!repo || repo.autoPullInterval <= 0) return;

  const cronExpr = getIntervalCron(repo.autoPullInterval);
  if (!cronExpr) return;

  const job = cron.schedule(cronExpr, async () => {
    // Query fresh repo data each time
    const freshRepo = await prisma.repo.findUnique({ where: { id: repo.id } });
    if (!freshRepo) {
      stopRepoSchedule(repo.id);
      return;
    }
    await syncRepo(freshRepo.id, freshRepo.localPath, freshRepo.sshKeyId);
  });

  activeJobs.set(repo.id, job);
  console.log(`[Scheduler] Updated schedule for repo "${repo.name}" (every ${repo.autoPullInterval} min)`);
}

// Stop scheduler for a deleted repo
export function stopRepoSchedule(repoId: string) {
  const job = activeJobs.get(repoId);
  if (job) {
    job.stop();
    activeJobs.delete(repoId);
  }
}
