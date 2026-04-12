import { NextResponse } from "next/server";

const FLEET_SERVER_URL = process.env.NEXT_PUBLIC_FLEET_SERVER_URL || "https://orchardpatch-server-production.up.railway.app";
const FLEET_SERVER_TOKEN = process.env.NEXT_PUBLIC_FLEET_SERVER_TOKEN || "orchardpatch-fleet-2026";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const res = await fetch(`${FLEET_SERVER_URL}/devices/${encodeURIComponent(id)}`, {
      headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Device not found" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/fleet/devices/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch device" }, { status: 500 });
  }
}
