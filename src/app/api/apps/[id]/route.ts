import { NextResponse } from "next/server";
import { getApp } from "@/lib/jamfClient";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const result = await getApp(id);
    if (!result) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/apps/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch app" }, { status: 500 });
  }
}
