import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { gitPull } from '@/lib/git';
import { withSshKey } from '@/lib/ssh-key-helper';

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

  // Read the raw body for event parsing and signature verification
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Determine event type
  const event = request.headers.get('x-github-event')
    || request.headers.get('x-gitea-event')
    || request.headers.get('x-gitee-event')
    || '';

  // Handle ping event
  if (event === 'ping') {
    return NextResponse.json({ message: 'pong' });
  }

  // Only handle push events — reject everything else
  if (event !== 'push') {
    return NextResponse.json({ message: 'Event ignored', event });
  }

  // Pull latest changes using the secure withSshKey helper
  try {
    let pullResult: { success: boolean; output?: string; error?: string } | undefined;
    await withSshKey(repo.sshKeyId, async (keyPath) => {
      pullResult = await gitPull(repo.localPath, keyPath);
    });

    if (pullResult?.success) {
      return NextResponse.json({ success: true, message: 'Pull successful', output: pullResult.output });
    } else {
      return NextResponse.json({ success: false, error: pullResult?.error || 'Pull failed' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}
