/**
 * /api/patch — Trigger a patch job.
 * In fleet/SaaS mode: proxies to the fleet server's /patch endpoint.
 * In local mode: proxies to the local OrchardPatch agent at localhost:47652.
 */

import { NextRequest, NextResponse } from "next/server";
import { AGENT_URL } from "@/lib/agent";

const FLEET_SERVER_URL = process.env.NEXT_PUBLIC_FLEET_SERVER_URL || "https://orchardpatch-server-production.up.railway.app";
const FLEET_SERVER_TOKEN = process.env.NEXT_PUBLIC_FLEET_SERVER_TOKEN || "orchardpatch-fleet-2026";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bundleId, label, appName, mode, deviceId } = body;

  if (!label || !appName) {
    return NextResponse.json({ error: "label and appName are required" }, { status: 400 });
  }

  // In SaaS/fleet mode, proxy to fleet server
  if (FLEET_SERVER_URL) {
    try {
      const res = await fetch(`${FLEET_SERVER_URL}/patch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-orchardpatch-token": FLEET_SERVER_TOKEN,
        },
        body: JSON.stringify({ bundleId, label, appName, mode, deviceId }),
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

  // Local agent mode
  try {
    const res = await fetch(`${AGENT_URL}/patch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundleId, label, appName, mode, deviceId }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Agent error" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Agent not reachable — is OrchardPatch agent running?" }, { status: 503 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
