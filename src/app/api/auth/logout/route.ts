import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login", request.nextUrl.origin)
  );
  response.cookies.set("orchardpatch_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return response;
}
