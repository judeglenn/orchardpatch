import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const loginPassword = process.env.LOGIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!loginPassword || !sessionSecret) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  if (!password || password !== loginPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Password correct — set cookie to SESSION_SECRET (never the password)
  const response = NextResponse.json({ ok: true });
  response.cookies.set("orchardpatch_session", sessionSecret, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return response;
}
