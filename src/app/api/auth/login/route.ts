import { NextRequest, NextResponse } from "next/server";
import {
  SITE_AUTH_COOKIE,
  expectedAuthCookieValue,
  isSiteAuthEnabled,
  verifySitePassword,
} from "@/lib/site-auth";

export async function POST(request: NextRequest) {
  if (!isSiteAuthEnabled()) {
    return NextResponse.json({ ok: true, authDisabled: true });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const password = body.password ?? "";
  if (!verifySitePassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await expectedAuthCookieValue();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SITE_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
