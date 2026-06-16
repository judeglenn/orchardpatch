/**
 * GET /api/patch-jobs — Proxy to fleet server patch-jobs list
 * Passes through query params: device_id, method, mode, status, limit
 */

import { NextRequest, NextResponse } from "next/server";

const FLEET_SERVER_URL = process.env.FLEET_SERVER_URL;
const FLEET_SERVER_TOKEN = process.env.FLEET_SERVER_TOKEN;

export async function GET(req: NextRequest) {
  if (!FLEET_SERVER_URL || !FLEET_SERVER_TOKEN) {
    return NextResponse.json({ error: "Fleet server not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const query = new URLSearchParams();
  for (const key of ["device_id", "method", "mode", "status", "limit"]) {
    const val = searchParams.get(key);
    if (val) query.append(key, val);
  }

  try {
    const url = `${FLEET_SERVER_URL}/patch-jobs${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, {
      headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN as string },
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Fleet server error" }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Fleet server not reachable" }, { status: 503 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
