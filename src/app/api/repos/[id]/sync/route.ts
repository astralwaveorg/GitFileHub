import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { withSshKey } from '@/lib/ssh-key-helper';
import { gitPull } from '@/lib/git';

/**
 * POST /api/repos/[id]/sync
 * Auth required. Perform git pull using repo's SSH key (60s timeout).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const { id } = await params;

    const repo = await prisma.repo.findUnique({
      where: { id },
      include: { sshKey: true },
    });

    if (!repo) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
    }

    let output = '';
    let error: string | undefined;

    try {
      await withSshKey(repo.sshKeyId, async (keyPath) => {
        const result = await gitPull(repo.localPath, keyPath);
        output = result.output || result.error || '';
        if (!result.success) {
          error = result.error || 'Git pull failed';
        }
      });
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Sync failed';
    }

    return NextResponse.json({
      success: !error,
      output,
      ...(error ? { error } : {}),
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
