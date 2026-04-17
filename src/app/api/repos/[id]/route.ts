import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { updateRepoSchedule, stopRepoSchedule } from '@/lib/scheduler';
import fs from 'fs/promises';

/**
 * PUT /api/repos/[id]
 * Auth required. Update repo settings (name, hiddenPaths, autoPullInterval, branch, platform).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const { name, hiddenPaths, autoPullInterval, branch, platform } = body;

    // Validate autoPullInterval
    if (autoPullInterval !== undefined) {
      const VALID_INTERVALS = [0, 30, 60, 120, 240];
      if (!VALID_INTERVALS.includes(Number(autoPullInterval))) {
        return NextResponse.json({ error: '同步间隔无效' }, { status: 400 });
      }
    }

    // Validate platform
    if (platform !== undefined && !['github', 'gitea', 'gitee'].includes(platform)) {
      return NextResponse.json({ error: '平台无效' }, { status: 400 });
    }

    const existing = await prisma.repo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
    }

    // Check name uniqueness if changing name
    if (name && name !== existing.name) {
      const nameConflict = await prisma.repo.findUnique({ where: { name } });
      if (nameConflict) {
        return NextResponse.json({ error: '仓库名称已存在' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (hiddenPaths !== undefined) {
      updateData.hiddenPaths = typeof hiddenPaths === 'string'
        ? hiddenPaths
        : JSON.stringify(hiddenPaths);
    }
    if (autoPullInterval !== undefined) updateData.autoPullInterval = autoPullInterval;
    if (branch !== undefined) updateData.branch = branch;
    if (platform !== undefined) updateData.platform = platform;

    await prisma.repo.update({
      where: { id },
      data: updateData,
    });

    // Update the auto-sync scheduler if interval changed
    if (autoPullInterval !== undefined) {
      updateRepoSchedule(id).catch((err) => {
        console.error(`[GitFileDock] Failed to update schedule for repo ${id}:`, err);
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/repos/[id]
 * Auth required. Delete repo from DB. Optionally delete local files.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteLocal = searchParams.get('deleteLocal') === 'true';

    const existing = await prisma.repo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
    }

    // Delete from DB (cascades to related records)
    await prisma.repo.delete({ where: { id } });

    // Stop any running auto-sync scheduler for this repo
    stopRepoSchedule(id);

    // Optionally delete local directory
    if (deleteLocal) {
      try {
        await fs.rm(existing.localPath, { recursive: true, force: true });
      } catch {
        // Directory may not exist — ignore
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
