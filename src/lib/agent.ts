/**
 * OrchardPatch Agent Client
 * Tries to connect to the local agent (http://127.0.0.1:47652).
 * Falls back to mock data gracefully when agent is not running.
 */

export const AGENT_URL = "http://127.0.0.1:47652";
export const AGENT_TIMEOUT = 2000; // 2s timeout — fast fail if not running

export type AgentStatus = "connected" | "disconnected" | "checking";

/**
 * Check if the local agent is running
 */
export async function checkAgent(): Promise<{ connected: boolean; hostname?: string; version?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT);

    const res = await fetch(`${AGENT_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return { connected: false };
    const data = await res.json();
    return { connected: true, hostname: data.hostname, version: data.version };
  } catch {
    return { connected: false };
  }
}

/**
 * Fetch local inventory from the agent
 */
export async function fetchLocalInventory() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${AGENT_URL}/inventory/local`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Agent returned ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Normalize agent inventory into the App/Device format the web app expects
 */
export function normalizeAgentInventory(agentData: {
  device: {
    hostname: string;
    serial: string;
    model: string;
    osVersion: string;
    ram: string;
    cpu: string;
    collectedAt: string;
  };
  collectedAt: string;
  apps: {
    name: string;
    bundleId: string;
    version: string;
    path: string;
    source: string;
  }[];
}) {
  const { device, apps } = agentData;

  // Build a single device record
  const deviceRecord = {
    id: `device-${device.serial}`,
    name: device.hostname,
    model: device.model,
    osVersion: device.osVersion,
    lastInventory: agentData.collectedAt ?? new Date().toISOString(),
    apps: apps.map((a) => ({
      appId: a.bundleId.replace(/\./g, "-"),
      appName: a.name,
      version: a.version,
    })),
  };

  // Build app records — one per unique bundle ID
  const appMap = new Map<string, {
    id: string;
    name: string;
    bundleId: string;
    category: string;
    versions: { version: string; deviceCount: number }[];
    totalInstalls: number;
    mostCommonVersion: string;
    hasVersionConflict: boolean;
    lastSeen: string;
  }>();

  for (const app of apps) {
    const id = app.bundleId.replace(/\./g, "-");
    if (!appMap.has(id)) {
      appMap.set(id, {
        id,
        name: app.name,
        bundleId: app.bundleId,
        category: categorizeApp(app.bundleId, app.name),
        versions: [{ version: app.version, deviceCount: 1 }],
        totalInstalls: 1,
        mostCommonVersion: app.version,
        hasVersionConflict: false,
        lastSeen: agentData.collectedAt ?? new Date().toISOString(),
      });
    }
  }

  const appList = Array.from(appMap.values());

  return {
    apps: appList,
    devices: [deviceRecord],
    stats: {
      totalApps: appList.length,
      totalDevices: 1,
      appsWithVersionConflicts: 0,
    },
    source: "agent" as const,
  };
}

/**
 * Simple category inference from bundle ID / name
 */
function categorizeApp(bundleId: string, name: string): string {
  const b = bundleId.toLowerCase();
  const n = name.toLowerCase();

  if (b.includes("microsoft") || n.includes("word") || n.includes("excel") || n.includes("powerpoint") || n.includes("outlook")) return "Productivity";
  if (b.includes("google.chrome") || b.includes("firefox") || b.includes("safari") || n.includes("browser")) return "Browser";
  if (b.includes("slack") || b.includes("zoom") || b.includes("discord") || b.includes("telegram") || b.includes("whatsapp")) return "Communication";
  if (b.includes("xcode") || b.includes("vscode") || b.includes("iterm") || b.includes("docker") || b.includes("github") || b.includes("postman")) return "Development";
  if (b.includes("figma") || b.includes("sketch") || b.includes("adobe") || b.includes("affinity")) return "Design";
  if (b.includes("apple")) return "System";
  if (b.includes("1password") || b.includes("security") || b.includes("vpn")) return "Security";
  return "Utilities";
}
