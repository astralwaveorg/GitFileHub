import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { withSshKey, generateWebhookSecret } from '@/lib/ssh-key-helper';
import { gitClone, isGitRepo } from '@/lib/git';
import fs from 'fs/promises';

/**
 * GET /api/repos
 * List repos (public — no auth required).
 * Returns: id, name, branch, platform, hiddenPaths, autoPullInterval, webhookSecret
 */
export async function GET() {
  try {
    const repos = await prisma.repo.findMany({
      select: {
        id: true,
        name: true,
        branch: true,
        platform: true,
        hiddenPaths: true,
        autoPullInterval: true,
        webhookSecret: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, repos });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/repos
 * Auth required. Create repo with name, remoteUrl, sshKeyId, branch, platform,
 * hiddenPaths, autoPullInterval. Generate webhookSecret (32 hex chars).
 * Set localPath = data/repos/{name}. Clone repo using git.ts.
 * Return webhookUrl.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const body = await request.json();
    const {
      name,
      remoteUrl,
      sshKeyId,
      branch = 'main',
      platform = 'github',
      hiddenPaths = [],
      autoPullInterval = 0,
    } = body;

    if (!name || !remoteUrl || !sshKeyId) {
      return NextResponse.json(
        { error: 'name, remoteUrl, and sshKeyId are required' },
        { status: 400 }
      );
    }

    // Validate SSH key exists
    const sshKey = await prisma.sSHKey.findUnique({ where: { id: sshKeyId } });
    if (!sshKey) {
      return NextResponse.json({ error: 'SSH key not found' }, { status: 400 });
    }

    // Check repo name uniqueness
    const existingRepo = await prisma.repo.findUnique({ where: { name } });
    if (existingRepo) {
      return NextResponse.json({ error: 'Repo name already exists' }, { status: 409 });
    }

    // Generate webhook secret (32 hex chars)
    const webhookSecret = generateWebhookSecret();
    const localPath = `data/repos/${name}`;

    // Create repo record in DB
    const repo = await prisma.repo.create({
      data: {
        name,
        remoteUrl,
        localPath,
        branch,
        platform,
        hiddenPaths: JSON.stringify(hiddenPaths),
        autoPullInterval,
        webhookSecret,
        sshKeyId,
      },
    });

    // Clone the repo asynchronously (don't block response)
    cloneRepoAsync(repo.id, remoteUrl, localPath, sshKeyId, branch).catch((err) => {
      console.error(`[GitFileDock] Failed to clone repo "${name}":`, err);
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/webhook/${webhookSecret}`;

    return NextResponse.json({
      success: true,
      repo: {
        id: repo.id,
        name: repo.name,
        branch: repo.branch,
        webhookUrl,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Clone a repo in the background.
 * Writes SSH key to temp file (mode 600), clones, then cleans up.
 * On failure, removes local directory and DB record.
 */
async function cloneRepoAsync(
  repoId: string,
  remoteUrl: string,
  localPath: string,
  sshKeyId: string,
  branch: string
) {
  try {
    const alreadyCloned = await isGitRepo(localPath);
    if (alreadyCloned) return;

    await withSshKey(sshKeyId, async (keyPath) => {
      const result = await gitClone(remoteUrl, localPath, keyPath, branch);
      if (!result.success) {
        throw new Error(result.error || 'Git clone failed');
      }
    });
  } catch (err: unknown) {
    // Clean up on failure
    try {
      await fs.rm(localPath, { recursive: true, force: true });
    } catch { /* ignore cleanup errors */ }

    await prisma.repo.delete({ where: { id: repoId } }).catch(() => {});
    throw err;
  }
}
