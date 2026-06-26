import { NextResponse } from "next/server";

const FLEET_SERVER_URL = process.env.FLEET_SERVER_URL;
const FLEET_SERVER_TOKEN = process.env.FLEET_SERVER_TOKEN;

export async function GET() {
  if (!FLEET_SERVER_URL || !FLEET_SERVER_TOKEN) {
    return NextResponse.json({ error: "Fleet server not configured" }, { status: 503 });
  }
  try {
    const res = await fetch(`${FLEET_SERVER_URL}/api/stats/patch-status`, {
      headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN as string },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Fleet server error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Fleet server not reachable" }, { status: 503 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
