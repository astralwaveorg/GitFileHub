import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifyPassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * PUT /api/auth/password
 * Require auth, verify old password, update to new password, set mustChangePwd=false.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Fetch user with password hash
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password and update
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        passwordHash: newHash,
        mustChangePwd: false,
      },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
