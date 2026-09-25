import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only; pages verify the session again against the database.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("wp_session");
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/login"] };
