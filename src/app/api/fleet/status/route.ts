import { NextResponse } from "next/server";

const FLEET_SERVER_URL = process.env.FLEET_SERVER_URL;
const FLEET_SERVER_TOKEN = process.env.FLEET_SERVER_TOKEN;

export async function GET() {
  if (!FLEET_SERVER_URL || !FLEET_SERVER_TOKEN) {
    return NextResponse.json({ error: "Fleet server not configured" }, { status: 503 });
  }
  try {
    const res = await fetch(`${FLEET_SERVER_URL}/stats`, {
      headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN as string },
      next: { revalidate: 30 },
    });
    if (!res.ok) return NextResponse.json({ connected: false, deviceCount: 0 });
    const data = await res.json();
    return NextResponse.json({ connected: true, deviceCount: data.totalDevices ?? 0 });
  } catch {
    return NextResponse.json({ connected: false, deviceCount: 0 });
  }
}
