import { NextResponse } from "next/server";
import { listApps } from "@/lib/jamfClient";

export async function GET() {
  try {
    const result = await listApps();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/apps]", error);
    return NextResponse.json({ error: "Failed to fetch apps" }, { status: 500 });
  }
}
