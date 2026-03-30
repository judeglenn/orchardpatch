/**
 * /api/patch/:jobId — Poll a patch job's status from the local agent.
 */

import { NextRequest, NextResponse } from "next/server";
import { AGENT_URL } from "@/lib/agent";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  try {
    const res = await fetch(`${AGENT_URL}/patch/${jobId}`, {
      signal: AbortSignal.timeout(3000),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Agent error" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "Agent not reachable" }, { status: 503 });
  }
}
