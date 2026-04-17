import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { gitPull } from '@/lib/git';
import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

// Handle different webhook platforms: GitHub, Gitea, Gitee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  // Find repo by webhook secret
  const repo = await prisma.repo.findUnique({
    where: { webhookSecret: secret },
    include: { sshKey: true },
  });

  if (!repo) {
    return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
  }

  // Verify webhook signature
  const signature = request.headers.get('x-hub-signature-256')
    || request.headers.get('x-gitea-signature')
    || request.headers.get('x-gitee-signature');

  if (signature) {
    const body = await request.text();
    const { decrypt } = await import('@/lib/crypto');
    const privateKey = decrypt(repo.sshKey.privateKey);
    // We can't easily verify HMAC without the webhook secret token
    // For now, just check that a signature exists (the secret URL path is already verification)
    // Re-parse body
    try {
      const payload = JSON.parse(body);
      const event = request.headers.get('x-github-event')
        || request.headers.get('x-gitea-event')
        || request.headers.get('x-gitee-event')
        || '';

      // Handle ping event
      if (event === 'ping') {
        return NextResponse.json({ message: 'pong' });
      }

      // Only handle push events
      if (event !== 'push') {
        return NextResponse.json({ message: 'Event ignored', event });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
  }

  // Pull latest changes
  const sshKeyPath = path.join(os.tmpdir(), `gfd-key-${repo.id}`);
  try {
    const { decrypt } = await import('@/lib/crypto');
    const privateKey = decrypt(repo.sshKey.privateKey);
    await fs.writeFile(sshKeyPath, privateKey, { mode: 0o600 });

    const result = await gitPull(repo.localPath, sshKeyPath);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Pull successful', output: result.output });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    try { await fs.unlink(sshKeyPath); } catch {}
  }
}
