import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import crypto from 'crypto';

/**
 * GET /api/keys
 * Require auth, list keys (id, name, fingerprint only — no private key).
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const keys = await prisma.sSHKey.findMany({
      select: {
        id: true,
        name: true,
        fingerprint: true,
        createdAt: true,
        _count: {
          select: { repos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    type KeyItem = { id: string; name: string; fingerprint: string; createdAt: Date; _count: { repos: number } };
    return NextResponse.json({
      success: true,
      keys: (keys as KeyItem[]).map((k: KeyItem) => ({
        id: k.id,
        name: k.name,
        fingerprint: k.fingerprint,
        createdAt: k.createdAt,
        repoCount: k._count.repos,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/keys
 * Require auth, create key with name + encrypted privateKey.
 * Compute fingerprint: SHA256 of private key content, take first 16 hex chars.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('response' in auth) return auth.response;

    const body = await request.json();
    const { name, privateKey } = body;

    if (!name || !privateKey) {
      return NextResponse.json(
        { error: 'Name and privateKey are required' },
        { status: 400 }
      );
    }

    // Compute fingerprint: first 16 hex chars of SHA256 of the private key
    const hash = crypto.createHash('sha256').update(privateKey).digest('hex');
    const fingerprint = hash.substring(0, 16);

    // Encrypt the private key before storing
    const encryptedKey = encrypt(privateKey);

    const key = await prisma.sSHKey.create({
      data: {
        name,
        privateKey: encryptedKey,
        fingerprint,
      },
    });

    return NextResponse.json({
      success: true,
      key: {
        id: key.id,
        name: key.name,
        fingerprint: key.fingerprint,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
