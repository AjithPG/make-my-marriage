import { NextResponse, type NextRequest } from "next/server";

// Must match the cookie name in src/server/auth/cookie.ts.
const SESSION_COOKIE = "mm_session";

/**
 * Early redirect for logged-out visitors of the dashboard (/w/*).
 * Only checks that the session cookie exists; it never trusts it. The real
 * session check happens server-side in handler() and the dashboard layout.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/w/:path*"],
};
