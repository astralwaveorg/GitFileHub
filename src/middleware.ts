import { NextRequest, NextResponse } from 'next/server';
import { getEdgeSession } from '@/lib/edge-auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Protected page paths (redirect to /login) ──
  const protectedPagePaths = ['/settings'];
  const isProtectedPage = protectedPagePaths.some((p) => pathname.startsWith(p));

  // ── Protected API patterns ──
  // /api/keys/* — all methods require auth
  if (pathname.startsWith('/api/keys')) {
    return checkAuth(request, isProtectedPage);
  }

  // /api/auth/password — all methods require auth
  if (pathname.startsWith('/api/auth/password')) {
    return checkAuth(request, isProtectedPage);
  }

  // /api/auth/me — requires auth
  if (pathname.startsWith('/api/auth/me')) {
    return checkAuth(request, isProtectedPage);
  }

  // /api/repos — only POST/PUT/DELETE require auth, GET is public
  if (pathname.startsWith('/api/repos')) {
    // /api/repos/[id]/status is always public GET
    if (/^\/api\/repos\/[^/]+\/status$/.test(pathname)) {
      return NextResponse.next();
    }
    // GET requests to /api/repos are public
    if (request.method === 'GET') {
      return NextResponse.next();
    }
    return checkAuth(request, false);
  }

  // /api/files/* — GET is public, mutations require auth
  if (pathname.startsWith('/api/files')) {
    if (request.method === 'GET') {
      return NextResponse.next();
    }
    return checkAuth(request, false);
  }

  // ── Protected pages ──
  if (isProtectedPage) {
    return checkAuth(request, true);
  }

  return NextResponse.next();
}

function checkAuth(request: NextRequest, isPage: boolean) {
  const session = getEdgeSession(request);

  if (!session) {
    if (isPage) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/settings/:path*',
    '/api/keys/:path*',
    '/api/auth/password',
    '/api/auth/me',
    '/api/repos/:path*',
    '/api/files/:path*',
  ],
};
