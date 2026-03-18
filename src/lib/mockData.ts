export interface App {
  id: string;
  name: string;
  bundleId: string;
  category: string;
  versions: { version: string; deviceCount: number }[];
  totalInstalls: number;
  mostCommonVersion: string;
  hasVersionConflict: boolean;
  lastSeen: string; // ISO date
}

export interface Device {
  id: string;
  name: string;
  model: string;
  osVersion: string;
  lastInventory: string; // ISO date
  apps: { appId: string; appName: string; version: string }[];
}

export interface AppInstallation {
  deviceId: string;
  deviceName: string;
  version: string;
  lastInventory: string;
}

// ─── Raw app catalog ─────────────────────────────────────────────────────────

const APP_CATALOG: {
  id: string;
  name: string;
  bundleId: string;
  category: string;
  primaryVersion: string;
  olderVersions: string[];
}[] = [
  { id: "app-001", name: "Google Chrome", bundleId: "com.google.Chrome", category: "Browser", primaryVersion: "124.0.6367.207", olderVersions: ["123.0.6312.122", "122.0.6261.128"] },
  { id: "app-002", name: "Slack", bundleId: "com.tinyspeck.slackmacgap", category: "Communication", primaryVersion: "4.38.125", olderVersions: ["4.37.97", "4.36.140"] },
  { id: "app-003", name: "Zoom", bundleId: "us.zoom.xos", category: "Communication", primaryVersion: "6.0.11.35001", olderVersions: ["5.17.11.34", "5.16.10.32"] },
  { id: "app-004", name: "Microsoft Word", bundleId: "com.microsoft.Word", category: "Productivity", primaryVersion: "16.85.24051214", olderVersions: ["16.84.24041420"] },
  { id: "app-005", name: "Microsoft Excel", bundleId: "com.microsoft.Excel", category: "Productivity", primaryVersion: "16.85.24051214", olderVersions: ["16.84.24041420", "16.83.24040416"] },
  { id: "app-006", name: "Microsoft PowerPoint", bundleId: "com.microsoft.Powerpoint", category: "Productivity", primaryVersion: "16.85.24051214", olderVersions: ["16.84.24041420"] },
  { id: "app-007", name: "Microsoft Outlook", bundleId: "com.microsoft.Outlook", category: "Email", primaryVersion: "16.85.24051214", olderVersions: ["16.84.24041420", "16.82.24021116"] },
  { id: "app-008", name: "1Password 7", bundleId: "com.agilebits.onepassword7", category: "Security", primaryVersion: "7.9.11", olderVersions: ["7.9.10"] },
  { id: "app-009", name: "Visual Studio Code", bundleId: "com.microsoft.VSCode", category: "Development", primaryVersion: "1.89.1", olderVersions: ["1.88.1", "1.87.2"] },
  { id: "app-010", name: "Figma", bundleId: "com.figma.Desktop", category: "Design", primaryVersion: "124.5.5", olderVersions: ["124.4.0", "123.8.0"] },
  { id: "app-011", name: "Notion", bundleId: "notion.id", category: "Productivity", primaryVersion: "3.11.0", olderVersions: ["3.10.0"] },
  { id: "app-012", name: "Arc Browser", bundleId: "company.thebrowser.Browser", category: "Browser", primaryVersion: "1.51.0.53267", olderVersions: ["1.49.0.52960"] },
  { id: "app-013", name: "Firefox", bundleId: "org.mozilla.firefox", category: "Browser", primaryVersion: "125.0.3", olderVersions: ["124.0.2", "123.0.1"] },
  { id: "app-014", name: "Spotify", bundleId: "com.spotify.client", category: "Entertainment", primaryVersion: "1.2.38.870", olderVersions: ["1.2.37.701"] },
  { id: "app-015", name: "iTerm2", bundleId: "com.googlecode.iterm2", category: "Development", primaryVersion: "3.5.1", olderVersions: ["3.5.0", "3.4.23"] },
  { id: "app-016", name: "Docker Desktop", bundleId: "com.docker.docker", category: "Development", primaryVersion: "4.29.0", olderVersions: ["4.28.0", "4.27.2"] },
  { id: "app-017", name: "GitHub Desktop", bundleId: "com.github.GitHubClient", category: "Development", primaryVersion: "3.3.14", olderVersions: ["3.3.12"] },
  { id: "app-018", name: "Postman", bundleId: "com.postmanlabs.mac", category: "Development", primaryVersion: "11.1.0", olderVersions: ["10.24.0", "10.23.0"] },
  { id: "app-019", name: "TablePlus", bundleId: "com.tinyapp.TablePlus", category: "Development", primaryVersion: "6.0.2", olderVersions: ["5.9.8"] },
  { id: "app-020", name: "Rectangle", bundleId: "com.knollsoft.Rectangle", category: "Utilities", primaryVersion: "0.83", olderVersions: ["0.82", "0.81"] },
  { id: "app-021", name: "Alfred", bundleId: "com.runningwithcrayons.Alfred", category: "Utilities", primaryVersion: "5.5", olderVersions: ["5.1.4"] },
  { id: "app-022", name: "CleanMyMac X", bundleId: "com.macpaw.CleanMyMac4", category: "Utilities", primaryVersion: "4.15.1", olderVersions: ["4.14.3", "4.13.6"] },
  { id: "app-023", name: "Bartender 4", bundleId: "com.surteesstudios.Bartender", category: "Utilities", primaryVersion: "4.2.27", olderVersions: ["4.2.26"] },
  { id: "app-024", name: "Bear", bundleId: "net.shinyfrog.bear", category: "Productivity", primaryVersion: "2.1.13", olderVersions: ["2.1.12"] },
  { id: "app-025", name: "Craft", bundleId: "com.luki.app.Craft", category: "Productivity", primaryVersion: "2.8.6", olderVersions: ["2.8.5"] },
  { id: "app-026", name: "Linear", bundleId: "com.linear", category: "Productivity", primaryVersion: "2024.04.01", olderVersions: ["2024.02.01", "2024.01.15"] },
  { id: "app-027", name: "Discord", bundleId: "com.hnc.Discord", category: "Communication", primaryVersion: "0.0.310", olderVersions: ["0.0.308", "0.0.306"] },
  { id: "app-028", name: "Telegram", bundleId: "ru.keepcoder.Telegram", category: "Communication", primaryVersion: "10.14.4", olderVersions: ["10.13.0"] },
  { id: "app-029", name: "WhatsApp", bundleId: "net.whatsapp.WhatsApp", category: "Communication", primaryVersion: "24.9.75", olderVersions: ["24.8.79"] },
  { id: "app-030", name: "Adobe Creative Cloud", bundleId: "com.adobe.acc.AdobeCreativeCloud", category: "Design", primaryVersion: "6.3.0.492", olderVersions: ["6.2.0.414", "5.12.0.669"] },
  { id: "app-031", name: "Sketch", bundleId: "com.bohemiancoding.sketch3", category: "Design", primaryVersion: "100.1", olderVersions: ["99.1", "98.3"] },
  { id: "app-032", name: "Affinity Designer 2", bundleId: "com.seriflabs.affinitydesigner2", category: "Design", primaryVersion: "2.4.1", olderVersions: ["2.3.1"] },
  { id: "app-033", name: "Keynote", bundleId: "com.apple.iWork.Keynote", category: "Productivity", primaryVersion: "14.1", olderVersions: ["13.2"] },
  { id: "app-034", name: "Pages", bundleId: "com.apple.iWork.Pages", category: "Productivity", primaryVersion: "14.1", olderVersions: ["13.2"] },
  { id: "app-035", name: "Numbers", bundleId: "com.apple.iWork.Numbers", category: "Productivity", primaryVersion: "14.1", olderVersions: ["13.2"] },
  { id: "app-036", name: "Safari", bundleId: "com.apple.Safari", category: "Browser", primaryVersion: "17.4.1", olderVersions: ["17.3.1"] },
  { id: "app-037", name: "Mail", bundleId: "com.apple.mail", category: "Email", primaryVersion: "16.0", olderVersions: [] },
  { id: "app-038", name: "Calendar", bundleId: "com.apple.iCal", category: "Productivity", primaryVersion: "14.0", olderVersions: [] },
  { id: "app-039", name: "Notes", bundleId: "com.apple.Notes", category: "Productivity", primaryVersion: "4.10", olderVersions: ["4.9"] },
  { id: "app-040", name: "Reminders", bundleId: "com.apple.reminders", category: "Productivity", primaryVersion: "7.1", olderVersions: [] },
  { id: "app-041", name: "Terminal", bundleId: "com.apple.Terminal", category: "Development", primaryVersion: "2.14", olderVersions: [] },
  { id: "app-042", name: "Xcode", bundleId: "com.apple.dt.Xcode", category: "Development", primaryVersion: "15.4", olderVersions: ["15.3", "15.2"] },
  { id: "app-043", name: "Simulator", bundleId: "com.apple.iphonesimulator", category: "Development", primaryVersion: "15.4", olderVersions: [] },
  { id: "app-044", name: "TestFlight", bundleId: "com.apple.TestFlight", category: "Development", primaryVersion: "3.4.1", olderVersions: [] },
  { id: "app-045", name: "Apple Configurator 2", bundleId: "com.apple.configurator.ui", category: "IT Management", primaryVersion: "2.17", olderVersions: ["2.16"] },
  { id: "app-046", name: "Jamf Connect", bundleId: "com.jamf.connect", category: "IT Management", primaryVersion: "2.34.0", olderVersions: ["2.33.0", "2.32.1"] },
  { id: "app-047", name: "Jamf Protect", bundleId: "com.jamf.protect", category: "Security", primaryVersion: "6.1.0", olderVersions: ["6.0.1", "5.8.0"] },
  { id: "app-048", name: "Microsoft Teams", bundleId: "com.microsoft.teams2", category: "Communication", primaryVersion: "24113.2708.2966.1590", olderVersions: ["24103.2708.2966.1590"] },
  { id: "app-049", name: "Loom", bundleId: "com.loom.desktop", category: "Communication", primaryVersion: "0.265.0", olderVersions: ["0.263.0"] },
  { id: "app-050", name: "Grammarly for Safari", bundleId: "com.grammarly.ProjectLlama", category: "Productivity", primaryVersion: "1.0.13", olderVersions: [] },
  { id: "app-051", name: "Raycast", bundleId: "com.raycast.macos", category: "Utilities", primaryVersion: "1.75.0", olderVersions: ["1.74.0", "1.72.0"] },
  { id: "app-052", name: "Obsidian", bundleId: "md.obsidian", category: "Productivity", primaryVersion: "1.5.12", olderVersions: ["1.5.8", "1.4.16"] },
  { id: "app-053", name: "Datadog Agent", bundleId: "com.datadoghq.agent", category: "Development", primaryVersion: "7.53.0", olderVersions: ["7.52.1"] },
  { id: "app-054", name: "Warp", bundleId: "dev.warp.Warp-Stable", category: "Development", primaryVersion: "2024.03.19", olderVersions: ["2024.02.20"] },
  { id: "app-055", name: "Proxyman", bundleId: "com.proxyman.NSProxy", category: "Development", primaryVersion: "4.12.0", olderVersions: ["4.11.0"] },
  { id: "app-056", name: "Paw", bundleId: "com.luckymarmot.Paw", category: "Development", primaryVersion: "3.4.4", olderVersions: [] },
  { id: "app-057", name: "SourceTree", bundleId: "com.touvola.SourceTree", category: "Development", primaryVersion: "4.2.7", olderVersions: ["4.2.6"] },
  { id: "app-058", name: "Sequel Pro", bundleId: "com.sequel-pro.sequel-pro", category: "Development", primaryVersion: "1.1.2", olderVersions: [] },
  { id: "app-059", name: "Atom", bundleId: "com.github.atom", category: "Development", primaryVersion: "1.63.1", olderVersions: [] },
  { id: "app-060", name: "Sublime Text", bundleId: "com.sublimetext.4", category: "Development", primaryVersion: "4169", olderVersions: ["4166", "4143"] },
  { id: "app-061", name: "Tower", bundleId: "com.fournova.Tower3", category: "Development", primaryVersion: "10.1", olderVersions: ["10.0"] },
  { id: "app-062", name: "Nova", bundleId: "com.panic.Nova", category: "Development", primaryVersion: "11.7", olderVersions: ["11.6", "11.5"] },
  { id: "app-063", name: "Retcon", bundleId: "com.git-retcon.Retcon", category: "Development", primaryVersion: "1.4.4", olderVersions: [] },
  { id: "app-064", name: "Lungo", bundleId: "at.steinpilz.Lungo", category: "Utilities", primaryVersion: "2.5.0", olderVersions: [] },
  { id: "app-065", name: "Hand Mirror", bundleId: "com.perfectionmade.HandMirror", category: "Utilities", primaryVersion: "3.7.1", olderVersions: [] },
  { id: "app-066", name: "Magnet", bundleId: "com.crowdcafe.windowmagnet", category: "Utilities", primaryVersion: "2.14.0", olderVersions: ["2.13.0"] },
  { id: "app-067", name: "Mimestream", bundleId: "com.mimestream.Mimestream", category: "Email", primaryVersion: "1.3.0", olderVersions: ["1.2.3"] },
  { id: "app-068", name: "Superhuman", bundleId: "com.superhuman.release", category: "Email", primaryVersion: "1.0.53", olderVersions: ["1.0.52"] },
  { id: "app-069", name: "Canary Mail", bundleId: "io.canarymail.mac", category: "Email", primaryVersion: "3.18", olderVersions: [] },
  { id: "app-070", name: "Spark – Email App by Readdle", bundleId: "com.readdle.SparkEmailApp", category: "Email", primaryVersion: "3.10.8", olderVersions: ["3.10.5"] },
  { id: "app-071", name: "Cursor", bundleId: "com.todesktop.230313mzl4w4u92", category: "Development", primaryVersion: "0.38.1", olderVersions: ["0.37.2", "0.35.0"] },
  { id: "app-072", name: "Keka", bundleId: "com.aone.keka", category: "Utilities", primaryVersion: "1.4.5", olderVersions: ["1.4.4"] },
  { id: "app-073", name: "The Unarchiver", bundleId: "com.macpaw.site.theunarchiver", category: "Utilities", primaryVersion: "4.3.8", olderVersions: [] },
  { id: "app-074", name: "Downie", bundleId: "com.charliemonroe.Downie", category: "Utilities", primaryVersion: "4.10", olderVersions: [] },
  { id: "app-075", name: "Permute 3", bundleId: "com.charliemonroe.Permute-3", category: "Utilities", primaryVersion: "1.7.4", olderVersions: [] },
  { id: "app-076", name: "Mosaic", bundleId: "com.lightpillar.mosaic", category: "Utilities", primaryVersion: "2.0.1", olderVersions: [] },
  { id: "app-077", name: "Elpass", bundleId: "com.elpass.app", category: "Security", primaryVersion: "1.7.11", olderVersions: [] },
  { id: "app-078", name: "Bitwarden", bundleId: "com.bitwarden.desktop", category: "Security", primaryVersion: "2024.3.1", olderVersions: ["2024.2.0"] },
  { id: "app-079", name: "Transporter", bundleId: "com.apple.TransporterApp", category: "Development", primaryVersion: "1.2.3", olderVersions: [] },
  { id: "app-080", name: "Screens 5", bundleId: "com.edovia.screens5", category: "Utilities", primaryVersion: "5.1.8", olderVersions: ["5.1.7"] },
];

// ─── Device name pools ────────────────────────────────────────────────────────

const FIRST_NAMES = ["jglenn", "sarah", "tmiller", "rbrown", "kwilliams", "mgarcia", "ljones", "asmith", "erodriguez", "clee", "dmartinez", "jhernandez", "mthompson", "bwhite", "kdavis", "nwilson", "pmartin", "qtaylor", "randerson", "sjackson", "ttaylor", "vthomas", "wharris", "xjohnson", "ymartin", "zmitchell", "arogers", "bscott", "cgreen", "dbaker", "eadams", "fhall", "gnelson", "hcarter", "iallen", "jyoung", "kking", "lwright", "mlopez", "nhill", "oscott", "pgonzalez", "qwilson", "rmoore", "staylor", "tjohnson", "uwilliams", "vdavis", "wbrown", "xjones"];

const MODELS: { name: string; type: "MBP" | "MBA" | "MACPRO" | "MINI" }[] = [
  { name: "MacBook Pro 14-inch (2023)", type: "MBP" },
  { name: "MacBook Pro 16-inch (2023)", type: "MBP" },
  { name: "MacBook Pro 14-inch (2021)", type: "MBP" },
  { name: "MacBook Pro 13-inch (M2, 2022)", type: "MBP" },
  { name: "MacBook Air 15-inch (M3, 2024)", type: "MBA" },
  { name: "MacBook Air 13-inch (M2, 2022)", type: "MBA" },
  { name: "MacBook Air 13-inch (M3, 2024)", type: "MBA" },
  { name: "Mac Pro (2023)", type: "MACPRO" },
  { name: "Mac Studio (2023)", type: "MACPRO" },
  { name: "Mac mini (M2, 2023)", type: "MINI" },
  { name: "Mac mini (M2 Pro, 2023)", type: "MINI" },
];

const OS_VERSIONS = ["26.3.2", "26.2.1", "26.1", "15.4.1", "15.3.2", "15.2", "15.1", "14.7.1", "14.6.1", "14.5"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date("2026-03-17");
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Build devices & install assignments ─────────────────────────────────────

function buildDataset(): { apps: App[]; devices: Device[] } {
  const rng = seededRandom(42);
  const rand = () => rng();
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  // Build 150 devices
  const rawDevices: { id: string; name: string; model: (typeof MODELS)[0]; osVersion: string; lastInventory: string }[] = [];

  const usedNames = new Set<string>();
  let idx = 0;
  while (rawDevices.length < 150) {
    const firstName = FIRST_NAMES[idx % FIRST_NAMES.length];
    const model = MODELS[Math.floor(rand() * MODELS.length)];
    const suffix = rawDevices.length < FIRST_NAMES.length ? "" : `-${Math.floor(rawDevices.length / FIRST_NAMES.length) + 1}`;
    const devName = `${firstName.toUpperCase()}-${model.type}${suffix}`;

    // IT / DEV special names sprinkled in
    let finalName = devName;
    if (rawDevices.length % 12 === 0) finalName = `IT-${model.type}-${String(Math.floor(rawDevices.length / 12) + 1).padStart(2, "0")}`;
    if (rawDevices.length % 20 === 0) finalName = `DEV-${model.type}-${String(Math.floor(rawDevices.length / 20) + 1).padStart(2, "0")}`;
    if (rawDevices.length % 25 === 0) finalName = `ENG-${model.type}-${String(Math.floor(rawDevices.length / 25) + 1).padStart(2, "0")}`;

    if (usedNames.has(finalName)) { idx++; continue; }
    usedNames.add(finalName);

    rawDevices.push({
      id: `dev-${String(rawDevices.length + 1).padStart(3, "0")}`,
      name: finalName,
      model: model,
      osVersion: pick(OS_VERSIONS),
      lastInventory: daysAgo(Math.floor(rand() * 30)),
    });
    idx++;
  }

  // Track installs per app: Map<appId, { deviceId, version }[]>
  const installMap = new Map<string, { deviceId: string; deviceName: string; version: string; lastInventory: string }[]>();
  APP_CATALOG.forEach(a => installMap.set(a.id, []));

  const deviceApps: { id: string; apps: { appId: string; appName: string; version: string }[] }[] = rawDevices.map(d => ({ id: d.id, apps: [] }));

  // Assign apps to devices
  rawDevices.forEach((device, dIdx) => {
    const appCount = 20 + Math.floor(rand() * 30); // 20-50 apps
    // Shuffle APP_CATALOG indices
    const appIndices = APP_CATALOG.map((_, i) => i).sort(() => rand() - 0.5).slice(0, appCount);

    appIndices.forEach(aIdx => {
      const appDef = APP_CATALOG[aIdx];
      // Determine version: 75% chance of primary, else older
      let version = appDef.primaryVersion;
      if (appDef.olderVersions.length > 0 && rand() < 0.28) {
        version = pick(appDef.olderVersions);
      }

      const installations = installMap.get(appDef.id)!;
      installations.push({ deviceId: device.id, deviceName: device.name, version, lastInventory: device.lastInventory });
      deviceApps[dIdx].apps.push({ appId: appDef.id, appName: appDef.name, version });
    });
  });

  // Build Apps array
  const apps: App[] = APP_CATALOG.map(appDef => {
    const installations = installMap.get(appDef.id)!;
    const versionCounts = new Map<string, number>();
    installations.forEach(inst => {
      versionCounts.set(inst.version, (versionCounts.get(inst.version) ?? 0) + 1);
    });

    const versions = Array.from(versionCounts.entries())
      .map(([version, deviceCount]) => ({ version, deviceCount }))
      .sort((a, b) => b.deviceCount - a.deviceCount);

    const mostCommonVersion = versions[0]?.version ?? appDef.primaryVersion;
    const hasVersionConflict = versions.length > 1;

    // Find last seen
    const lastSeen = installations.length > 0
      ? installations.reduce((latest, inst) => inst.lastInventory > latest ? inst.lastInventory : latest, installations[0].lastInventory)
      : daysAgo(1);

    return {
      id: appDef.id,
      name: appDef.name,
      bundleId: appDef.bundleId,
      category: appDef.category,
      versions,
      totalInstalls: installations.length,
      mostCommonVersion,
      hasVersionConflict,
      lastSeen,
    };
  });

  // Build Devices array
  const devices: Device[] = rawDevices.map((d, dIdx) => ({
    id: d.id,
    name: d.name,
    model: typeof d.model === "string" ? d.model : d.model.name,
    osVersion: d.osVersion,
    lastInventory: d.lastInventory,
    apps: deviceApps[dIdx].apps,
  }));

  return { apps, devices };
}

const { apps: APPS, devices: DEVICES } = buildDataset();

export const apps: App[] = APPS;
export const devices: Device[] = DEVICES;

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getAppById(id: string): App | undefined {
  return apps.find(a => a.id === id);
}

export function getDeviceById(id: string): Device | undefined {
  return devices.find(d => d.id === id);
}

export function getAppInstallations(appId: string): AppInstallation[] {
  const results: AppInstallation[] = [];
  for (const device of devices) {
    const installed = device.apps.find(a => a.appId === appId);
    if (installed) {
      results.push({
        deviceId: device.id,
        deviceName: device.name,
        version: installed.version,
        lastInventory: device.lastInventory,
      });
    }
  }
  return results.sort((a, b) => b.lastInventory.localeCompare(a.lastInventory));
}

export function getDeviceApps(deviceId: string): { appId: string; appName: string; version: string }[] {
  const device = getDeviceById(deviceId);
  return device?.apps ?? [];
}

export const stats = {
  totalApps: apps.length,
  totalDevices: devices.length,
  appsWithVersionConflicts: apps.filter(a => a.hasVersionConflict).length,
};
