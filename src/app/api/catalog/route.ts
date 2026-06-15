/**
 * /api/catalog — Proxy to fleet server catalog with pagination + search
 */

import { NextRequest, NextResponse } from "next/server";

const FLEET_SERVER_URL = process.env.NEXT_PUBLIC_FLEET_SERVER_URL;
const FLEET_SERVER_TOKEN = process.env.NEXT_PUBLIC_FLEET_SERVER_TOKEN;

export async function GET(req: NextRequest) {
  if (!FLEET_SERVER_URL || !FLEET_SERVER_TOKEN) {
    return NextResponse.json({ error: "Fleet server not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const pageNum = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const offset = (pageNum - 1) * limitNum;

  try {
    const query = new URLSearchParams();
    if (search) query.append("search", search);
    query.append("limit", limitNum.toString());
    query.append("offset", offset.toString());

    const res = await fetch(`${FLEET_SERVER_URL}/api/catalog?${query.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-orchardpatch-token": FLEET_SERVER_TOKEN as string,
      },
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Fleet server error" }, { status: res.status });
    }

    // Translate server's offset-based response to page-based for the frontend
    const page = Math.floor(data.offset / data.limit) + 1;
    const pages = Math.ceil(data.total / data.limit);
    return NextResponse.json({ ...data, page, pages });
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Fleet server not reachable" }, { status: 503 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
