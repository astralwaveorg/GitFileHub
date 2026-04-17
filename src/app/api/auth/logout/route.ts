import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Clear the token cookie to end the session.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
