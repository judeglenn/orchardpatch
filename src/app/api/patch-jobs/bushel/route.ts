/**
 * /api/patch-jobs/bushel — Patch by the Bushel (one app, all outdated devices)
 * Proxies to the fleet server's /patch-jobs/bushel endpoint.
 */

import { NextRequest, NextResponse } from "next/server";

const FLEET_SERVER_URL = process.env.NEXT_PUBLIC_FLEET_SERVER_URL || "https://orchardpatch-server-production.up.railway.app";
const FLEET_SERVER_TOKEN = process.env.NEXT_PUBLIC_FLEET_SERVER_TOKEN || "orchardpatch-fleet-2026";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { label, mode } = body;

  if (!label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  // Proxy to fleet server
  try {
    const res = await fetch(`${FLEET_SERVER_URL}/patch-jobs/bushel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-orchardpatch-token": FLEET_SERVER_TOKEN,
      },
      body: JSON.stringify({ label, mode }),
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
