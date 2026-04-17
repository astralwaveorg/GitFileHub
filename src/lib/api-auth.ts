import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from './auth';
import { prisma } from './db';

export type AuthSuccess = { userId: string; username: string };
export type AuthFailure = { response: NextResponse };
export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Require authentication for a protected API route.
 * Reads the JWT token from the httpOnly cookie and verifies it.
 * Returns { userId, username } on success, or { response } with a 401 on failure.
 */
export async function requireAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  }

  return { userId: payload.userId, username: payload.username };
}

/**
 * Helper: check if an AuthResult is a failure (has 'response' key).
 */
export function isAuthFailure(result: AuthResult): result is AuthFailure {
  return 'response' in result;
}

/**
 * Get the full authenticated user object from the database.
 * Returns null if not authenticated or user not found.
 */
export async function getAuthenticatedUser() {
  const result = await requireAuth();
  if (isAuthFailure(result)) return null;

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: {
      id: true,
      username: true,
      mustChangePwd: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}
