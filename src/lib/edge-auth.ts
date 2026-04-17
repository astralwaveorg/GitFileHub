import { NextRequest } from 'next/server';
import type { JWTPayload } from './auth';

/**
 * Edge-compatible JWT payload extraction.
 * This does NOT verify the cryptographic signature — it only base64-decodes
 * the payload portion of the JWT. Real verification happens in API routes
 * via auth.ts / verifyToken().
 *
 * Safe for middleware routing decisions only; never for real authorization.
 */
export function getEdgeSession(request: NextRequest): JWTPayload | null {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (!tokenMatch) return null;

    const token = tokenMatch[1];
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the base64url-encoded payload (second segment)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) return null;

    return {
      userId: payload.userId,
      username: payload.username,
    } as JWTPayload;
  } catch {
    return null;
  }
}
