import { NextRequest } from 'next/server';
import type { JWTPayload } from './auth';

/**
 * Edge-compatible JWT session extraction WITH signature verification.
 * Uses Web Crypto API (available in Edge Runtime) for HMAC-SHA256.
 * Falls back to null if verification fails.
 */
export async function getEdgeSession(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (!tokenMatch) return null;

    const token = tokenMatch[1];
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const secret = process.env.JWT_SECRET || '';
    if (!secret) return null;

    // Use Web Crypto API for HMAC-SHA256 (Edge Runtime compatible)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const data = encoder.encode(`${parts[0]}.${parts[1]}`);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);

    // Convert base64url
    const expectedSig = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare with provided signature (also hex)
    const providedSig = parts[2];
    if (expectedSig !== providedSig) return null;

    // Decode the base64url-encoded payload
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));

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
