import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

interface GitResult {
  success: boolean;
  output: string;
  error?: string;
}

export async function gitClone(remoteUrl: string, localPath: string, sshKeyPath: string, branch: string = 'main'): Promise<GitResult> {
  try {
    await fs.mkdir(localPath, { recursive: true });
    const GIT_SSH = `ssh -i ${sshKeyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`;
    const { stdout, stderr } = await execAsync(
      `GIT_SSH_COMMAND="${GIT_SSH}" git clone --branch ${branch} --single-branch ${remoteUrl} ${localPath}`,
      { timeout: 120000 }
    );
    return { success: true, output: stdout, error: stderr };
  } catch (error: unknown) {
    return { success: false, output: '', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function gitPull(localPath: string, sshKeyPath: string): Promise<GitResult> {
  try {
    const GIT_SSH = `ssh -i ${sshKeyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`;
    const { stdout, stderr } = await execAsync(
      `GIT_SSH_COMMAND="${GIT_SSH}" git -C ${localPath} pull`,
      { timeout: 60000 }
    );
    return { success: true, output: stdout, error: stderr };
  } catch (error: unknown) {
    return { success: false, output: '', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function gitAddAll(localPath: string): Promise<GitResult> {
  try {
    const { stdout } = await execAsync(`git -C ${localPath} add -A`, { timeout: 30000 });
    return { success: true, output: stdout };
  } catch (error: unknown) {
    return { success: false, output: '', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function gitCommit(localPath: string, message: string): Promise<GitResult> {
  try {
    const userName = process.env.GIT_USER_NAME || 'GitFileDock';
    const userEmail = process.env.GIT_USER_EMAIL || 'gitfiledock@local';
    const { stdout, stderr } = await execAsync(
      `git -C ${localPath} -c user.name="${userName}" -c user.email="${userEmail}" commit -m ${JSON.stringify(message)}`,
      { timeout: 30000 }
    );
    return { success: true, output: stdout, error: stderr };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('nothing to commit')) {
      return { success: true, output: 'No changes to commit' };
    }
    return { success: false, output: '', error: msg };
  }
}

export async function gitPush(localPath: string, sshKeyPath: string): Promise<GitResult> {
  try {
    const GIT_SSH = `ssh -i ${sshKeyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`;
    const { stdout, stderr } = await execAsync(
      `GIT_SSH_COMMAND="${GIT_SSH}" git -C ${localPath} push`,
      { timeout: 60000 }
    );
    return { success: true, output: stdout, error: stderr };
  } catch (error: unknown) {
    return { success: false, output: '', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function gitGetCurrentBranch(localPath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`git -C ${localPath} rev-parse --abbrev-ref HEAD`);
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

export async function gitGetLatestCommit(localPath: string): Promise<{ hash: string; message: string; date: string }> {
  try {
    const { stdout } = await execAsync(`git -C ${localPath} log -1 --format="%H|%s|%ci"`);
    const [hash, message, date] = stdout.trim().split('|');
    return { hash: hash.substring(0, 7), message, date };
  } catch {
    return { hash: 'unknown', message: 'unknown', date: '' };
  }
}

export async function gitGetStatus(localPath: string): Promise<{ branch: string; commit: { hash: string; message: string; date: string } }> {
  const branch = await gitGetCurrentBranch(localPath);
  const commit = await gitGetLatestCommit(localPath);
  return { branch, commit };
}

export async function isGitRepo(localPath: string): Promise<boolean> {
  try {
    await execAsync(`git -C ${localPath} rev-parse --git-dir`);
    return true;
  } catch {
    return false;
  }
}

export async function autoCommitAndPush(localPath: string, sshKeyPath: string, message: string): Promise<GitResult> {
  const addResult = await gitAddAll(localPath);
  if (!addResult.success) return addResult;

  const commitResult = await gitCommit(localPath, message);
  if (!commitResult.success) return commitResult;

  if (commitResult.output === 'No changes to commit') return commitResult;

  return await gitPush(localPath, sshKeyPath);
}
