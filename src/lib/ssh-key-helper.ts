import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { decrypt } from './crypto';
import { prisma } from './db';

/**
 * Write an encrypted SSH key to a temp file with mode 600,
 * then call the callback, and clean up afterwards.
 */
export async function withSshKey(
  sshKeyId: string,
  callback: (keyPath: string) => Promise<void>
): Promise<void> {
  const keyRecord = await prisma.sSHKey.findUnique({ where: { id: sshKeyId } });
  if (!keyRecord) throw new Error('SSH key not found');

  const decryptedKey = decrypt(keyRecord.privateKey);
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `gfd-ssh-${crypto.randomBytes(8).toString('hex')}`);

  try {
    await fs.writeFile(tmpFile, decryptedKey, { mode: 0o600 });
    await callback(tmpFile);
  } finally {
    try {
      await fs.unlink(tmpFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Generate a random webhook secret (32 hex chars).
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(16).toString('hex');
}
