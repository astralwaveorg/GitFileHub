import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
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

    const existing = await prisma.repo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
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
