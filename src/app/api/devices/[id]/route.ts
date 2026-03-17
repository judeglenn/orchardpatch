import { NextResponse } from "next/server";
import { getDevice } from "@/lib/jamfClient";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const result = await getDevice(id);
    if (!result) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/devices/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch device" }, { status: 500 });
  }
}
