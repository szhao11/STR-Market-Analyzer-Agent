import { NextRequest, NextResponse } from "next/server";
import {
  SITE_AUTH_COOKIE,
  isAuthenticated,
  isSiteAuthEnabled,
} from "@/lib/site-auth";

export async function middleware(request: NextRequest) {
  if (!isSiteAuthEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const authed = await isAuthenticated(
    request.cookies.get(SITE_AUTH_COOKIE)?.value
  );

  if (authed) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
