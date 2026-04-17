import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import crypto from 'crypto';

/**
 * PUT /api/keys/[id]
 * Require auth, update key name and/or privateKey.
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
    const { name, privateKey } = body;

    if (!name && !privateKey) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const existing = await prisma.sSHKey.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    const updateData: { name?: string; privateKey?: string; fingerprint?: string } = {};

    if (name) updateData.name = name;

    if (privateKey) {
      const hash = crypto.createHash('sha256').update(privateKey).digest('hex');
      updateData.fingerprint = hash.substring(0, 16);
      updateData.privateKey = encrypt(privateKey);
    }

    await prisma.sSHKey.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/keys/[id]
 * Require auth, check if used by repos, then delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const { id } = await params;

    const existing = await prisma.sSHKey.findUnique({
      where: { id },
      include: { repos: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    if (existing.repos.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete key: it is used by ${existing.repos.length} repo(s)` },
        { status: 400 }
      );
    }

    await prisma.sSHKey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
