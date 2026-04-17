import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

interface GitResult {
  success: boolean;
  output: string;
  error?: string;
}

function sshEnv(sshKeyPath: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GIT_SSH_COMMAND: `ssh -i ${sshKeyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`,
  };
}

export async function gitClone(remoteUrl: string, localPath: string, sshKeyPath: string, branch: string = 'main'): Promise<GitResult> {
  try {
    // Only create parent dir — git clone creates the target dir itself
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    const { stdout, stderr } = await execFileAsync('git', [
      'clone', '--branch', branch, '--single-branch', remoteUrl, localPath,
    ], { timeout: 120000, env: sshEnv(sshKeyPath) });
    return { success: true, output: stdout, error: stderr };
  } catch (error: unknown) {
    return { success: false, output: '', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function gitPull(localPath: string, sshKeyPath: string): Promise<GitResult> {
  try {
    const { stdout, stderr } = await execFileAsync('git', ['pull'], {
      timeout: 60000,
      cwd: localPath,
      env: sshEnv(sshKeyPath),
    });
    return { success: true, output: stdout, error: stderr };
  } catch (error: unknown) {
    return { success: false, output: '', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function gitAddAll(localPath: string): Promise<GitResult> {
  try {
    const { stdout } = await execFileAsync('git', ['add', '-A'], { timeout: 30000, cwd: localPath });
    return { success: true, output: stdout };
  } catch (error: unknown) {
    return { success: false, output: '', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function gitCommit(localPath: string, message: string): Promise<GitResult> {
  try {
    const userName = process.env.GIT_USER_NAME || 'GitFileDock';
    const userEmail = process.env.GIT_USER_EMAIL || 'gitfiledock@local';
    const { stdout, stderr } = await execFileAsync('git', [
      '-c', `user.name=${userName}`, '-c', `user.email=${userEmail}`, 'commit', '-m', message,
    ], { timeout: 30000, cwd: localPath });
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
    const { stdout, stderr } = await execFileAsync('git', ['push'], {
      timeout: 60000,
      cwd: localPath,
      env: sshEnv(sshKeyPath),
    });
    return { success: true, output: stdout, error: stderr };
  } catch (error: unknown) {
    return { success: false, output: '', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function gitGetCurrentBranch(localPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: localPath });
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

export async function gitGetLatestCommit(localPath: string): Promise<{ hash: string; message: string; date: string }> {
  try {
    const { stdout } = await execFileAsync('git', ['log', '-1', '--format=%H|%s|%ci'], { cwd: localPath });
    const trimmed = stdout.trim();
    const parts = trimmed.split('|');
    if (parts.length < 3) {
      return { hash: 'unknown', message: 'unknown', date: '' };
    }
    const [hash, message, date] = parts;
    return { hash: (hash || 'unknown').substring(0, 7), message: message || 'unknown', date: date || '' };
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
    await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd: localPath });
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
