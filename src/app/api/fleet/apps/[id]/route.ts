import { NextResponse } from "next/server";
import { categorizeApp } from "@/lib/agent";

const FLEET_SERVER_URL = process.env.NEXT_PUBLIC_FLEET_SERVER_URL || "https://orchardpatch-server-production.up.railway.app";
const FLEET_SERVER_TOKEN = process.env.NEXT_PUBLIC_FLEET_SERVER_TOKEN || "orchardpatch-fleet-2026";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Context) {
  try {
    const { id } = await params;

    // Fetch all apps (for device_name join) + all app statuses (for patch_status/latest_version)
    const [appsRes, statusRes, devicesRes] = await Promise.all([
      fetch(`${FLEET_SERVER_URL}/apps`, {
        headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
        next: { revalidate: 30 },
      }),
      fetch(`${FLEET_SERVER_URL}/apps/status`, {
        headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
        next: { revalidate: 30 },
      }),
      fetch(`${FLEET_SERVER_URL}/devices`, {
        headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
        next: { revalidate: 30 },
      }),
    ]);

    if (!appsRes.ok || !statusRes.ok) {
      return NextResponse.json({ error: "Failed to fetch apps from fleet server" }, { status: 502 });
    }

    const [appsData, statusData, devicesData] = await Promise.all([
      appsRes.json(),
      statusRes.json(),
      devicesRes.ok ? devicesRes.json() : Promise.resolve({ devices: [] }),
    ]);

    // Build device hostname lookup: device_id → hostname
    const deviceNames: Record<string, string> = {};
    for (const d of (devicesData.devices || [])) {
      deviceNames[d.id] = d.hostname || d.id;
    }
    // Also pick up device_name from /apps rows (cheaper fallback)
    for (const a of (appsData.apps || [])) {
      if (a.device_id && a.device_name && !deviceNames[a.device_id]) {
        deviceNames[a.device_id] = a.device_name;
      }
    }

    // Match status rows by bundle_id (id param is bundle_id with dots→hyphens)
    const matchingStatus: any[] = (statusData.apps || []).filter((a: any) => {
      const appId = (a.bundle_id || "").replace(/\./g, "-").toLowerCase();
      return appId === id.toLowerCase();
    });

    if (matchingStatus.length === 0) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Aggregate version distribution and installations from status rows
    const versionMap: Record<string, number> = {};
    let latestVersion: string | null = null;
    let lastSeen = "";
    let hasAnyOutdated = false;

    const installations = matchingStatus.map((a: any) => {
      const v = a.version || "unknown";
      versionMap[v] = (versionMap[v] || 0) + 1;
      if (a.latest_version && !latestVersion) latestVersion = a.latest_version;
      if (a.last_checked && a.last_checked > lastSeen) lastSeen = a.last_checked;
      if (a.patch_status === "outdated") hasAnyOutdated = true;

      return {
        deviceId: a.device_id,
        deviceName: deviceNames[a.device_id] || a.device_id,
        version: v,
        lastInventory: a.last_checked || new Date().toISOString(),
        patchStatus: a.patch_status,
        isOutdated: a.patch_status === "outdated",
      };
    });

    const versions = Object.entries(versionMap)
      .map(([version, deviceCount]) => ({ version, deviceCount }))
      .sort((a, b) => b.deviceCount - a.deviceCount);

    // hasVersionConflict: true if any device is outdated (vs latest_version), not just version diversity
    const hasVersionConflict = hasAnyOutdated;

    const first = matchingStatus[0];
    const app = {
      id,
      name: first.name,
      bundleId: first.bundle_id,
      category: categorizeApp(first.bundle_id || "", first.name || ""),
      versions,
      totalInstalls: matchingStatus.length,
      mostCommonVersion: versions[0]?.version || "unknown",
      hasVersionConflict,
      lastSeen,
      latestVersion,
    };

    return NextResponse.json({ app, installations });
  } catch (error) {
    console.error("[GET /api/fleet/apps/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch app" }, { status: 500 });
  }
}
