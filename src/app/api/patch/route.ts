/**
 * /api/patch — Proxy to the local OrchardPatch agent's patch endpoint.
 * The web app calls this; this calls the agent on localhost:47652.
 */

import { NextRequest, NextResponse } from "next/server";
import { AGENT_URL } from "@/lib/agent";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bundleId, label, appName, mode, deviceId } = body;

  if (!label || !appName) {
    return NextResponse.json({ error: "label and appName are required" }, { status: 400 });
  }

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
