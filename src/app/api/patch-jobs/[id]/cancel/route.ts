/**
 * /api/patch-jobs/[id]/cancel — Cancel a pending patch job
 * Proxies to the fleet server's /patch-jobs/:id/cancel endpoint.
 */

import { NextRequest, NextResponse } from "next/server";

const FLEET_SERVER_URL = process.env.FLEET_SERVER_URL;
const FLEET_SERVER_TOKEN = process.env.FLEET_SERVER_TOKEN;

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Context) {
  if (!FLEET_SERVER_URL || !FLEET_SERVER_TOKEN) {
    return NextResponse.json({ error: "Fleet server not configured" }, { status: 503 });
  }
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
  }

  // Proxy to fleet server
  try {
    const res = await fetch(`${FLEET_SERVER_URL}/patch-jobs/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-orchardpatch-token": FLEET_SERVER_TOKEN as string,
      },
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Fleet server error", status: data.status },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Fleet server not reachable" }, { status: 503 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
