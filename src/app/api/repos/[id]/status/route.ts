import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { gitGetStatus } from '@/lib/git';

/**
 * GET /api/repos/[id]/status
 * Public (no auth required). Return branch + latest commit info.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const repo = await prisma.repo.findUnique({
      where: { id },
    });

    if (!repo) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
    }

    const status = await gitGetStatus(repo.localPath);

    return NextResponse.json({
      success: true,
      branch: status.branch,
      commit: status.commit,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
