/**
 * OrchardPatch Fleet Server Client
 * Talks to the central orchardpatch-server instead of the local agent.
 * Used when SERVER_URL is configured.
 */

export const FLEET_SERVER_URL = process.env.NEXT_PUBLIC_FLEET_SERVER_URL || "https://orchardpatch-server.fly.dev";
export const FLEET_SERVER_TOKEN = process.env.NEXT_PUBLIC_FLEET_SERVER_TOKEN || "orchardpatch-fleet-2026";

async function fleetFetch(path: string) {
  const res = await fetch(`${FLEET_SERVER_URL}${path}`, {
    headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
    next: { revalidate: 30 }, // cache for 30s in Next.js
  });
  if (!res.ok) throw new Error(`Fleet server returned ${res.status}`);
  return res.json();
}

export async function getFleetStats() {
  return fleetFetch("/stats");
}

export async function getFleetDevices() {
  return fleetFetch("/devices");
}

export async function getFleetDevice(id: string) {
  return fleetFetch(`/devices/${encodeURIComponent(id)}`);
}

export async function getFleetApps(outdatedOnly = false) {
  return fleetFetch(`/apps${outdatedOnly ? "?outdated=true" : ""}`);
}

export async function getFleetPatchJobs() {
  return fleetFetch("/patch-jobs");
}

export function isFleetMode(): boolean {
  return !!FLEET_SERVER_URL;
}
