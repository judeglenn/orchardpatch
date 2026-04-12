import { NextResponse } from "next/server";

const FLEET_SERVER_URL = process.env.NEXT_PUBLIC_FLEET_SERVER_URL || "https://orchardpatch-server-production.up.railway.app";
const FLEET_SERVER_TOKEN = process.env.NEXT_PUBLIC_FLEET_SERVER_TOKEN || "orchardpatch-fleet-2026";

export async function GET() {
  try {
    const res = await fetch(`${FLEET_SERVER_URL}/stats`, {
      headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
      next: { revalidate: 30 },
    });
    if (!res.ok) return NextResponse.json({ connected: false, deviceCount: 0 });
    const data = await res.json();
    return NextResponse.json({ connected: true, deviceCount: data.totalDevices ?? 0 });
  } catch {
    return NextResponse.json({ connected: false, deviceCount: 0 });
  }
}
