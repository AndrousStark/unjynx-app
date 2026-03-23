// ---------------------------------------------------------------------------
// Route Protection Middleware
// ---------------------------------------------------------------------------
// Runs on every navigation to enforce authentication. Checks for the
// `unjynx_token` cookie (set by storeTokens in lib/api/auth.ts).
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that do not require authentication
const PUBLIC_PATH_PREFIXES = ['/login', '/signup', '/callback', '/forgot-password'] as const;

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('unjynx_token')?.value;
  const { pathname } = request.nextUrl;

  // Unauthenticated user trying to access a protected route -> redirect to login
  if (!token && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access auth pages -> redirect to dashboard
  if (token && isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *  - api routes (Next.js API or proxy)
     *  - _next/static, _next/image (Next.js internals)
     *  - favicon.ico, public assets
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|apple-touch-icon\\.png|robots\\.txt|sitemap\\.xml).*)',
  ],
};
