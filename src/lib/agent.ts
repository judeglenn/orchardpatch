/**
 * OrchardPatch Agent Client
 * Tries to connect to the local agent (http://127.0.0.1:47652).
 * Falls back to mock data gracefully when agent is not running.
 */

export const AGENT_URL = "http://localhost:47652";
export const AGENT_TIMEOUT = 2000; // 2s timeout — fast fail if not running

export type AgentStatus = "connected" | "disconnected" | "checking";

/**
 * Check if the local agent is running
 * Skips check on production (non-localhost) to avoid CORS errors
 */
export async function checkAgent(): Promise<{ connected: boolean; hostname?: string; version?: string }> {
  // Skip agent check if not running on localhost (production/Vercel)
  // Only check agent in browser context on localhost
  if (typeof window === 'undefined') {
    // Server-side: skip agent check
    return { connected: false };
  }
  if (!window.location.hostname.includes('localhost')) {
    // Production: skip agent check
    return { connected: false };
  }

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
    latestVersion?: string | null;
    isOutdated?: boolean;
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
    if (appMap.has(id)) {
      const existing = appMap.get(id)!;
      const existingVersion = existing.versions.find(v => v.version === app.version);
      if (existingVersion) {
        existingVersion.deviceCount++;
      } else {
        existing.versions.push({ version: app.version, deviceCount: 1 });
      }
      existing.totalInstalls++;
    } else {
      appMap.set(id, {
        id,
        name: app.name,
        bundleId: app.bundleId,
        category: categorizeApp(app.bundleId, app.name),
        versions: [{ version: app.version, deviceCount: 1 }],
        totalInstalls: 1,
        mostCommonVersion: app.version,
        hasVersionConflict: app.isOutdated === true,
        lastSeen: agentData.collectedAt ?? new Date().toISOString(),
        latestVersion: app.latestVersion ?? null,
      } as any);
    }
  }

  // Post-process: sort versions, find most common, detect multi-device conflicts
  for (const app of appMap.values()) {
    app.versions.sort((a, b) => b.deviceCount - a.deviceCount);
    app.mostCommonVersion = app.versions[0].version;
    if (app.versions.length > 1) app.hasVersionConflict = true;
  }

  const appList = Array.from(appMap.values());

  const conflictCount = appList.filter(a => a.hasVersionConflict).length;

  return {
    apps: appList,
    devices: [deviceRecord],
    stats: {
      totalApps: appList.length,
      totalDevices: 1,
      appsWithVersionConflicts: conflictCount,
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

  // Browsers
  if (
    b.includes("google.chrome") || b.includes("org.mozilla.firefox") ||
    b.includes("com.apple.safari") || b.includes("com.microsoft.edgemac") ||
    b.includes("com.operasoftware") || b.includes("com.brave.browser") ||
    b.includes("com.arc-browser") || b.includes("company.thebrowser") ||
    n === "safari" || n === "firefox" || n === "chrome" || n === "opera" ||
    n.includes("browser") || n === "brave" || n === "arc"
  ) return "Browsers";

  // Communication
  if (
    b.includes("com.tinyspeck.slackmacgap") || b.includes("com.slack") ||
    b.includes("us.zoom.xos") || b.includes("com.zoom") ||
    b.includes("com.hnc.discord") || b.includes("com.discord") ||
    b.includes("com.telegram") || b.includes("org.telegram") ||
    b.includes("net.whatsapp") || b.includes("com.microsoft.teams") ||
    b.includes("com.apple.facetime") || b.includes("com.apple.messages") ||
    b.includes("com.skype") || b.includes("com.readdle.smartemail") ||
    n.includes("slack") || n.includes("zoom") || n.includes("discord") ||
    n.includes("telegram") || n.includes("whatsapp") || n.includes("teams") ||
    n.includes("skype") || n === "messages" || n === "facetime" || n === "mail"
  ) return "Communication";

  // Development
  if (
    b.includes("com.microsoft.vscode") || b.includes("com.apple.dt.xcode") ||
    b.includes("com.docker") || b.includes("com.github.atom") ||
    b.includes("com.jetbrains") || b.includes("com.sublimetext") ||
    b.includes("com.postmanlabs") || b.includes("com.torusknot.sourcetreeformac") ||
    b.includes("com.github.githubnativeapp") || b.includes("com.googlecode.iterm2") ||
    b.includes("com.apple.terminal") || b.includes("io.cursor") ||
    b.includes("com.anthropic") || b.includes("dev.warp") ||
    n.includes("xcode") || n.includes("vscode") || n === "visual studio code" ||
    n.includes("docker") || n.includes("iterm") || n.includes("terminal") ||
    n.includes("postman") || n.includes("sourcetree") || n.includes("github desktop") ||
    n.includes("intellij") || n.includes("pycharm") || n.includes("webstorm") ||
    n.includes("cursor") || n === "warp" || n.includes("simulator")
  ) return "Development";

  // Design
  if (
    b.includes("com.figma") || b.includes("com.bohemiancoding.sketch") ||
    b.includes("com.adobe") || b.includes("com.affinity") ||
    b.includes("com.pixelmator") || b.includes("com.canva") ||
    b.includes("com.zeplin") || b.includes("com.invisionapp") ||
    n.includes("figma") || n.includes("sketch") || n.includes("photoshop") ||
    n.includes("illustrator") || n.includes("indesign") || n.includes("affinity") ||
    n.includes("pixelmator") || n.includes("canva") || n.includes("zeplin")
  ) return "Design";

  // Media
  if (
    b.includes("com.spotify") || b.includes("com.apple.music") ||
    b.includes("org.videolan.vlc") || b.includes("com.apple.quicktimeplayer") ||
    b.includes("com.apple.podcasts") || b.includes("com.apple.tv") ||
    b.includes("com.plex") || b.includes("com.netflix") ||
    b.includes("com.loom") || b.includes("com.apple.photos") ||
    n.includes("spotify") || n === "vlc" || n.includes("music") ||
    n.includes("quicktime") || n.includes("podcasts") || n === "tv" ||
    n.includes("plex") || n.includes("netflix") || n === "loom" || n === "photos"
  ) return "Media";

  // Security
  if (
    b.includes("com.agilebits.onepassword") || b.includes("com.1password") ||
    b.includes("com.bitwarden") || b.includes("com.lastpass") ||
    b.includes("com.nordvpn") || b.includes("com.expressvpn") ||
    b.includes("com.malwarebytes") || b.includes("com.sentinelone") ||
    b.includes("com.crowdstrike") || b.includes("com.jamf") ||
    n.includes("1password") || n.includes("bitwarden") || n.includes("lastpass") ||
    n.includes("vpn") || n.includes("keychain") || n.includes("antivirus") ||
    n.includes("malwarebytes") || n.includes("security")
  ) return "Security";

  // Productivity
  if (
    b.includes("com.microsoft.word") || b.includes("com.microsoft.excel") ||
    b.includes("com.microsoft.powerpoint") || b.includes("com.microsoft.outlook") ||
    b.includes("com.microsoft.office") || b.includes("com.apple.iwork") ||
    b.includes("com.apple.keynote") || b.includes("com.apple.pages") ||
    b.includes("com.apple.numbers") || b.includes("com.apple.reminders") ||
    b.includes("com.apple.notes") || b.includes("com.apple.calendar") ||
    b.includes("com.notion") || b.includes("com.airtable") ||
    b.includes("com.evernote") || b.includes("com.todoist") ||
    b.includes("com.omnigroup") || b.includes("md.obsidian") ||
    n.includes("word") || n.includes("excel") || n.includes("powerpoint") ||
    n.includes("outlook") || n.includes("keynote") || n.includes("pages") ||
    n.includes("numbers") || n === "notes" || n === "reminders" || n === "calendar" ||
    n.includes("notion") || n.includes("evernote") || n.includes("todoist") ||
    n.includes("obsidian") || n.includes("office")
  ) return "Productivity";

  // System (Apple system apps)
  if (
    b.startsWith("com.apple.") ||
    n === "finder" || n === "system preferences" || n === "system settings" ||
    n === "activity monitor" || n === "disk utility" || n === "console" ||
    n === "migration assistant" || n === "airdrop" || n.includes("app store")
  ) return "System";

  return "Utilities";
}
