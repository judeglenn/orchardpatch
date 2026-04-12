import { NextResponse } from "next/server";

const FLEET_SERVER_URL = process.env.NEXT_PUBLIC_FLEET_SERVER_URL || "https://orchardpatch-server-production.up.railway.app";
const FLEET_SERVER_TOKEN = process.env.NEXT_PUBLIC_FLEET_SERVER_TOKEN || "orchardpatch-fleet-2026";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const res = await fetch(`${FLEET_SERVER_URL}/apps`, {
      headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch apps" }, { status: res.status });
    }
    const data = await res.json();
    const allApps: any[] = data.apps || [];

    // Match apps by converting bundle_id dots to hyphens (same as HomePageInner)
    const matching = allApps.filter((a: any) => {
      const appId = (a.bundle_id || "").replace(/\./g, "-").toLowerCase();
      return appId === id.toLowerCase();
    });

    if (matching.length === 0) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Aggregate version distribution and installations
    const versionMap: Record<string, number> = {};
    const installations: { deviceId: string; deviceName: string; version: string; lastInventory: string }[] = [];
    let hasVersionConflict = false;
    let latestVersion: string | null = null;
    let lastSeen = "";

    for (const a of matching) {
      const v = a.version || "unknown";
      versionMap[v] = (versionMap[v] || 0) + 1;
      if (a.latest_version && !latestVersion) latestVersion = a.latest_version;
      if (a.last_seen && a.last_seen > lastSeen) lastSeen = a.last_seen;
      installations.push({
        deviceId: a.device_id,
        deviceName: a.device_name,
        version: a.version || "unknown",
        lastInventory: a.last_seen,
      });
    }

    const versions = Object.entries(versionMap)
      .map(([version, deviceCount]) => ({ version, deviceCount }))
      .sort((a, b) => b.deviceCount - a.deviceCount);

    // Detect version conflicts: more than one distinct version installed
    hasVersionConflict = versions.length > 1;

    // Compute latest version via semver-style comparison if not provided by server
    if (!latestVersion && versions.length > 0) {
      latestVersion = versions
        .map((v) => v.version)
        .filter((v) => v !== "unknown")
        .sort((a, b) => {
          const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
          const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
          for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const diff = (pb[i] || 0) - (pa[i] || 0);
            if (diff !== 0) return diff;
          }
          return 0;
        })[0] || null;
    }

    const installationsWithOutdated = installations.map((inst) => ({
      ...inst,
      isOutdated: latestVersion !== null && inst.version !== latestVersion,
    }));

    const first = matching[0];
    const app = {
      id,
      name: first.name,
      bundleId: first.bundle_id,
      category: "Utilities",
      versions,
      totalInstalls: matching.length,
      mostCommonVersion: versions[0]?.version || "unknown",
      hasVersionConflict,
      lastSeen,
      latestVersion,
    };

    return NextResponse.json({ app, installations: installationsWithOutdated });
  } catch (error) {
    console.error("[GET /api/fleet/apps/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch app" }, { status: 500 });
  }
}
