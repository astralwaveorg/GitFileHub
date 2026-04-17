import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

/**
 * POST /api/auth/login
 * Validate username/password against DB, set HttpOnly JWT cookie (7d, sameSite lax),
 * return user info with mustChangePwd flag.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Look up user by username
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Sign JWT (7 day expiry)
    const token = signToken({ userId: user.id, username: user.username });

    // Build response with user info
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        mustChangePwd: user.mustChangePwd,
        createdAt: user.createdAt,
      },
    });

    // Set HttpOnly JWT cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 604800, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
