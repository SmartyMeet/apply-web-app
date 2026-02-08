import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware that captures the full incoming URL (with all query parameters)
 * on the very first server-side hit — before Next.js routing or client hydration
 * can strip them. The data is stored in a short-lived cookie so the client can
 * read it even if the browser URL has already been cleaned up.
 *
 * This is critical for job-board redirects (Indeed, LinkedIn, etc.) that append
 * tracking params to the redirect URL.
 */
export function middleware(request: NextRequest) {
  const { searchParams, pathname, search } = request.nextUrl;

  // Reconstruct the public-facing URL using the Host / X-Forwarded-Host header
  // instead of request.nextUrl.href which returns the internal localhost URL on Amplify.
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const publicUrl = `${protocol}://${host}${pathname}${search}`;

  // Capture the Referer header server-side — this is the full URL the user
  // came from (e.g. the Indeed job page). document.referrer on the client
  // may be truncated by referrer policies.
  const referer = request.headers.get('referer') || '';

  // Log every page hit so we can see exactly what URL arrives from job boards
  console.log('[Middleware] Incoming request:', {
    url: publicUrl,
    referer: referer || '(none)',
    params: searchParams.toString() || '(none)',
    userAgent: request.headers.get('user-agent')?.substring(0, 80),
  });

  // If there are no query params AND no referer, nothing to capture
  if (searchParams.toString().length === 0 && !referer) {
    return NextResponse.next();
  }

  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const trackingPayload = JSON.stringify({
    params,
    landingUrl: publicUrl,
    referer,
    capturedAt: Date.now(),
  });

  const response = NextResponse.next();
  response.cookies.set('st_tracking', trackingPayload, {
    path: '/',
    maxAge: 60 * 30, // 30 minutes — covers a single session
    httpOnly: false,  // client JS needs to read it
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  // Run only on page routes, skip API / static / internal Next.js paths
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
