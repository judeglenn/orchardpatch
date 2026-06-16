import { NextRequest, NextResponse } from "next/server";

const FLEET_SERVER_URL = process.env.FLEET_SERVER_URL;
const FLEET_SERVER_TOKEN = process.env.FLEET_SERVER_TOKEN;

export async function GET(req: NextRequest) {
  if (!FLEET_SERVER_URL || !FLEET_SERVER_TOKEN) {
    return NextResponse.json({ error: "Fleet server not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const device_id = searchParams.get("device_id");

  try {
    let url = `${FLEET_SERVER_URL}/apps/status`;
    if (device_id) {
      url += `?device_id=${encodeURIComponent(device_id)}`;
    }

    const res = await fetch(url, {
      headers: {
        "x-orchardpatch-token": FLEET_SERVER_TOKEN as string,
      },
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
