"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppById, getAppInstallations } from "@/lib/mockData";
import { getAgentApp, getAgentStore } from "@/lib/agentStore";
import { VersionChartWrapper } from "@/components/VersionChartWrapper";
import { appInitials, appColorClass, formatDate, formatRelativeDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, AlertTriangle, Monitor, CheckCircle2, Clock, Zap, BellOff, Bell, MessageSquare, X } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const COLORS = ["#7dd94a", "#ff9800", "#4caf50", "#64b5f6", "#f44336", "#90caf9", "#ab47bc", "#26a69a"];

type PatchMode = "silent" | "managed" | "prompted";

const INSTALLOMATOR_LABELS: Record<string, string> = {
  // Browsers
  "org.mozilla.firefox": "firefoxpkg",
  "org.mozilla.firefoxpkg": "firefoxpkg",
  "com.google.Chrome": "googlechromepkg",
  "com.microsoft.edgemac": "microsoftedge",
  "com.brave.Browser": "brave",
  "com.operasoftware.Opera": "opera",
  "com.apple.Safari": "safari", // via softwareupdate

  // Communication
  "us.zoom.xos": "zoom",
  "com.tinyspeck.slackmacgap": "slack",
  "com.microsoft.teams2": "microsoftteams",
  "com.cisco.webex.meetings": "webex",
  "com.discord.Discord": "discord",
  "com.hnc.Discord": "discord",
  "com.skype.skype": "skype",
  "ru.keepcoder.Telegram": "telegram",
  "com.loom.desktop": "loom",

  // Microsoft Office
  "com.microsoft.Word": "microsoftword",
  "com.microsoft.Excel": "microsoftexcel",
  "com.microsoft.Powerpoint": "microsoftpowerpoint",
  "com.microsoft.Outlook": "microsoftoutlook",
  "com.microsoft.onenote.mac": "microsoftonenote",
  "com.microsoft.OneDrive": "onedrive",
  "com.microsoft.rdc.macos": "microsoftremotedesktop",

  // Development
  "com.microsoft.VSCode": "visualstudiocode",
  "com.todesktop.230313mzl4w4u92": "cursor",
  "com.docker.docker": "docker",
  "com.github.GitHubClient": "githubdesktop",
  "com.jetbrains.intellij": "intellijidea",
  "com.jetbrains.WebStorm": "webstorm",
  "com.jetbrains.pycharm": "pycharm",
  "com.sublimetext.4": "sublimetext4",
  "com.googlecode.iterm2": "iterm2",
  "com.postmanlabs.mac": "postman",
  "com.tinyapp.TablePlus": "tableplus",
  "com.useinsomnia.insomnia": "insomnia",

  // Productivity
  "com.figma.Desktop": "figma",
  "notion.id": "notion",
  "com.agilebits.onepassword7": "1password7",
  "com.agilebits.onepassword8": "1password8",
  "com.dropbox.client2": "dropbox",
  "com.google.GoogleDrive": "googledrive",
  "com.obsidian.md": "obsidian",
  "md.obsidian": "obsidian",
  "com.grammarly.ProjectLlama": "grammarly",
  "com.mango.sketch": "sketch",
  "com.bohemiancoding.sketch3": "sketch",
  "com.adobe.CreativeCloud": "adobecreativeclouddesktop",
  "com.readdle.smartemail": "spark",
  "com.culturedcode.ThingsMac": "things3",
  "com.flexibits.fantastical2.mac": "fantastical",
  "com.tunnelbear.TunnelBear": "tunnelbear",

  // Utilities
  "com.knollsoft.Rectangle": "rectangle",
  "com.runningwithcrayons.Alfred": "alfred",
  "com.hegenberg.BetterTouchTool": "bettertouchtool",
  "com.macpaw.CleanMyMac4": "cleanmymacx",
  "com.malwarebytes.antimalware": "malwarebytes",
  "org.videolan.vlc": "vlc",
  "com.spotify.client": "spotify",
  "com.apple.dt.Xcode": "xcode",
  "com.prefs.BackgroundMusic": "backgroundmusic",
  "org.whispersystems.signal-desktop": "signal",
  "com.microsoft.autoupdate2": "microsoftautoupdate",
};

function getInstallomatorLabel(bundleId: string): string | null {
  return INSTALLOMATOR_LABELS[bundleId] ?? null;
}

export default function AppDetailPage({ params }: Props) {
  const { id } = use(params);

  const [agentLoaded, setAgentLoaded] = useState(false);
  const [agentFetched, setAgentFetched] = useState(false);

  // If not in mock data, try loading from agent
  useEffect(() => {
    if (!getAppById(id) && !getAgentApp(id) && !agentFetched) {
      setAgentFetched(true);
      import("@/lib/agent").then(({ checkAgent, fetchLocalInventory, normalizeAgentInventory }) => {
        checkAgent().then(async ({ connected }) => {
          if (!connected) { setAgentLoaded(true); return; }
          try {
            const raw = await fetchLocalInventory();
            const normalized = normalizeAgentInventory(raw);
            import("@/lib/agentStore").then(({ setAgentData }) => {
              setAgentData(normalized.apps as any, normalized.devices as any, new Date().toISOString());
              setAgentLoaded(true);
            });
          } catch { setAgentLoaded(true); }
        });
      });
    } else {
      setAgentLoaded(true);
    }
  }, [id]);

  // All hooks must be before any conditional returns
  const [showPatchModal, setShowPatchModal] = useState(false);
  const [patchMode, setPatchMode] = useState<PatchMode>("managed");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [patchDeviceId, setPatchDeviceId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Try to find app by ID, then by bundle ID pattern match as fallback for demo mode
  let app = getAppById(id) ?? getAgentApp(id);
  if (!app && id.includes("-")) {
    // ID might be a bundle ID with dots replaced (e.g. "ru-keepcoder-Telegram")
    // Try to find by searching mock apps for matching bundle ID
    const bundleIdPattern = id.replace(/-/g, ".");
    const { apps: mockApps } = require("@/lib/mockData");
    app = mockApps.find((a: any) => a.bundleId.toLowerCase() === bundleIdPattern.toLowerCase());
  }
  // For agent apps, build installations from agent device store
  const agentStore = getAgentStore();
  const installations = getAppInstallations(id).length > 0
    ? getAppInstallations(id)
    : (agentStore.devices ?? []).flatMap(d =>
        d.apps
          .filter(a => a.appId === id)
          .map(a => ({
            deviceId: d.id,
            deviceName: d.name,
            version: a.version,
            lastInventory: d.lastInventory,
          }))
      );

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function handleConfirmPatch() {
    setShowPatchModal(false);
    if (!app) return;

    const label = getInstallomatorLabel(app.bundleId);
    if (!label) {
      showToast(`⚠️ No Installomator label found for ${app.name}`);
      return;
    }

    const target = patchDeviceId ? `1 device` : `all ${installations.length} device${installations.length !== 1 ? "s" : ""}`;
    showToast(`🌳 Queuing ${patchMode} patch for ${app.name}...`);

    try {
      const res = await fetch("/api/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: app.bundleId,
          label,
          appName: app.name,
          mode: patchMode,
          deviceId: patchDeviceId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(`❌ ${data.error || "Patch failed to queue"}`);
        return;
      }

      setActiveJobId(data.jobId);
      showToast(`✅ Patch job queued (${target}) — monitoring...`);
      pollJobStatus(data.jobId);
    } catch {
      showToast(`❌ Agent not reachable — is it running?`);
    }

    setPatchDeviceId(null);
  }

  function pollJobStatus(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/patch/${jobId}`);
        const job = await res.json();
        if (job.status === "success") {
          clearInterval(interval);
          setActiveJobId(null);
          showToast(`✅ ${app?.name} patched successfully!`);
        } else if (job.status === "failed") {
          clearInterval(interval);
          setActiveJobId(null);
          showToast(`❌ Patch failed: ${job.error || "unknown error"}`);
        }
      } catch {
        clearInterval(interval);
        setActiveJobId(null);
      }
    }, 2500);
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  }

  const glassPanel: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
  };

  if (!agentLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#7dd94a", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
          <ChevronLeft className="h-4 w-4" /> App Inventory
        </Link>
        <div className="text-center py-20">
          <p className="text-lg font-semibold" style={{ color: "#f0f8ec" }}>App not found</p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>This app may not be in the current inventory.</p>
        </div>
      </div>
    );
  }

  const initials = appInitials(app.name);
  const colorClass = appColorClass(app.name);

  return (
    <div className="px-6 py-6">
      {/* Back button */}
      <div className="mb-5">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}>
          <ChevronLeft className="h-4 w-4" />
          App Inventory
        </Link>
      </div>

      {/* App header */}
      <div className="flex items-center gap-5 mb-6 rounded-2xl px-6 py-5" style={glassPanel}>
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white text-xl font-bold shadow-sm ${colorClass}`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-xl font-bold" style={{ color: "#f0f8ec" }}>{app.name}</h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(125,217,74,0.12)", color: "#9fe066", border: "1px solid rgba(125,217,74,0.3)" }}>{app.category}</span>
            {app.hasVersionConflict ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,160,0,0.12)", border: "1px solid rgba(255,160,0,0.35)", color: "#ffb74d" }}>
                <AlertTriangle className="h-3 w-3" />
                Outdated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(125,217,74,0.12)", border: "1px solid rgba(125,217,74,0.35)", color: "#9fe066" }}>
                <CheckCircle2 className="h-3 w-3" />
                No Conflicts
              </span>
            )}
          </div>
          <p className="text-xs font-mono mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>{app.bundleId}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            <span className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              <strong style={{ color: "#f0f8ec" }}>{app.totalInstalls}</strong>&nbsp;installs
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Last seen {formatRelativeDate(app.lastSeen)}
            </span>
          </div>
        </div>
        {app.hasVersionConflict && (
          <button
            onClick={() => { setPatchDeviceId(null); setShowPatchModal(true); }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{ background: "#5aaa28", color: "white" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#6abf32")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#5aaa28")}
          >
            🍎 Patch All
          </button>
        )}
      </div>

      {/* Outdated / No Conflicts banner */}
      {app.hasVersionConflict ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl px-4 py-3.5" style={{ background: "rgba(255,160,0,0.08)", border: "1px solid rgba(255,160,0,0.25)" }}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#ffb74d" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#ffb74d" }}>Outdated version detected</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,183,77,0.8)" }}>
              Installed version is <strong className="font-mono">{app.mostCommonVersion}</strong>.
              {(app as any).latestVersion && (
                <> Latest available is <strong className="font-mono">{(app as any).latestVersion}</strong>.</>
              )}
              {" "}Consider patching.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-2xl px-4 py-3.5" style={{ background: "rgba(125,217,74,0.08)", border: "1px solid rgba(125,217,74,0.25)" }}>
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#7dd94a" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#9fe066" }}>No version conflicts</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(159,224,102,0.8)" }}>
              All {app.totalInstalls} device{app.totalInstalls !== 1 ? "s" : ""} are running <strong className="font-mono">{app.mostCommonVersion}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Patch This App */}
      <div className="mb-6 rounded-2xl overflow-hidden" style={glassPanel}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: "#7dd94a" }} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.55)" }}>Patch Policies</p>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Choose how updates are deployed to devices running {app.name}.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {[
            {
              key: "silent" as PatchMode,
              icon: <BellOff className="h-4 w-4" />,
              label: "Silent",
              description: "No notifications. App is force-quit if open and updated silently. Best for overnight deployments.",
              flags: "NOTIFY=silent · BLOCKING=kill",
              active: app.hasVersionConflict,
            },
            {
              key: "managed" as PatchMode,
              icon: <Bell className="h-4 w-4" style={{ color: "#7dd94a" }} />,
              label: "Managed",
              description: "Notifies the user the app must quit to update. User must comply. Balanced for most enterprise use cases.",
              flags: "NOTIFY=success · BLOCKING=tell_user",
              recommended: true,
              active: app.hasVersionConflict,
            },
            {
              key: "prompted" as PatchMode,
              icon: <MessageSquare className="h-4 w-4" />,
              label: "User Prompted",
              description: "User sees a \"Quit and Update\" or \"Not Now\" dialog. They control when the update happens.",
              flags: "NOTIFY=all · BLOCKING=prompt_user",
              active: app.hasVersionConflict,
            },
          ].map(({ key, icon, label, description, flags, recommended, active }) => (
            <div key={key} className="p-5 flex flex-col gap-3" style={{ background: key === "managed" ? "rgba(125,217,74,0.04)" : undefined }}>
              <div className="flex items-center gap-2">
                <span style={{ color: key === "managed" ? "#7dd94a" : "rgba(255,255,255,0.55)" }}>{icon}</span>
                <span className="text-sm font-semibold" style={{ color: "#f0f8ec" }}>{label}</span>
                {recommended && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(125,217,74,0.15)", color: "#9fe066" }}>Recommended</span>
                )}
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{description}</p>
              <div className="text-[10px] font-mono rounded px-2 py-1" style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.4)" }}>{flags}</div>
              {active ? (
                <button
                  onClick={() => { setPatchMode(key); setPatchDeviceId(null); setShowPatchModal(true); }}
                  className="mt-auto w-full text-xs font-semibold py-2 rounded-md transition-all active:scale-95"
                  style={{
                    background: key === "managed" ? "#5aaa28" : "#4a9020",
                    color: "white",
                    border: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#6abf32")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = key === "managed" ? "#5aaa28" : "#4a9020")}
                >
                  {activeJobId ? "⏳ Patching..." : `Deploy ${label} 🍎`}
                </button>
              ) : (
                <button
                  className="mt-auto w-full text-xs font-semibold py-2 rounded-md cursor-not-allowed"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.08)" }}
                  disabled
                >
                  Up to date — No patch needed
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Version distribution */}
      {app.versions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl p-5" style={glassPanel}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>Version Distribution</p>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Devices per installed version</p>
            <VersionChartWrapper versions={app.versions} />
          </div>
          <div className="rounded-2xl p-5" style={glassPanel}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>Version Breakdown</p>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>{app.versions.length} version{app.versions.length !== 1 ? "s" : ""} detected</p>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {app.versions.map((v, i) => {
                const pct = Math.round((v.deviceCount / app.totalInstalls) * 100);
                return (
                  <div key={v.version} className="flex items-center gap-3 py-2.5">
                    <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-medium" style={{ color: "#f0f8ec" }}>{v.version}</span>
                        {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(125,217,74,0.12)", color: "#9fe066" }}>Installed</span>}
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                    <span className="text-xs shrink-0 w-28 text-right" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {v.deviceCount} device{v.deviceCount !== 1 ? "s" : ""} · {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Device installations table */}
      <div className="rounded-2xl overflow-hidden" style={glassPanel}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.55)" }}>Installed Devices</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {installations.length} device{installations.length !== 1 ? "s" : ""} with {app.name} installed
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}>Device Name</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}>Installed Version</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}>Last Inventory</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-right" style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}>Patch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installations.map((inst, idx) => (
                <TableRow key={inst.deviceId} className="group" style={{ background: idx % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent", borderColor: "rgba(255,255,255,0.06)" }}>
                  <TableCell>
                    <Link href={`/devices/${inst.deviceId}`} className="font-medium text-sm flex items-center gap-2 transition-colors" style={{ color: "#f0f8ec" }}>
                      <Monitor className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
                      {inst.deviceName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={
                      app.hasVersionConflict
                        ? { background: "rgba(255,160,0,0.12)", color: "#ffb74d", border: "1px solid rgba(255,160,0,0.3)" }
                        : { color: "rgba(255,255,255,0.55)" }
                    }>
                      {inst.version}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{formatDate(inst.lastInventory)}</TableCell>
                  <TableCell className="text-right">
                    {app.hasVersionConflict ? (
                      <button
                        onClick={() => { setPatchDeviceId(inst.deviceId); setShowPatchModal(true); }}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all hover:opacity-80 active:scale-95"
                        style={{ background: "#5aaa28", color: "white" }}
                      >
                        🍎 Patch
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                        Up to date
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Patch modal */}
      {showPatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPatchModal(false); }}>
          <div
            className="rounded-2xl shadow-2xl w-full max-w-sm"
            style={{
              background: "rgba(12,22,8,0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div className="px-6 pt-6 pb-4 flex items-start justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🍎</span>
                  <h2 className="text-base font-bold" style={{ color: "#f0f8ec" }}>Patch by the Fruit</h2>
                </div>
                <p className="text-sm font-medium" style={{ color: "#9fe066" }}>{app.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {patchDeviceId ? "1 device selected" : `All ${installations.length} device${installations.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button onClick={() => setShowPatchModal(false)} style={{ color: "rgba(255,255,255,0.4)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>Patch Mode</p>
              <div className="flex flex-col gap-2">
                {([
                  { key: "silent" as PatchMode, icon: <BellOff className="h-3.5 w-3.5" />, label: "Silent", sub: "Force quit, no prompts", recommended: false },
                  { key: "managed" as PatchMode, icon: <Bell className="h-3.5 w-3.5" />, label: "Managed", sub: "Notify, must comply", recommended: true },
                  { key: "prompted" as PatchMode, icon: <MessageSquare className="h-3.5 w-3.5" />, label: "User Prompted", sub: "User chooses when", recommended: false },
                ] as const).map(({ key, icon, label, sub, recommended }) => (
                  <button key={key} onClick={() => setPatchMode(key)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                    style={{
                      border: patchMode === key ? "1px solid rgba(125,217,74,0.5)" : "1px solid rgba(255,255,255,0.12)",
                      background: patchMode === key ? "rgba(125,217,74,0.12)" : "rgba(255,255,255,0.04)",
                      boxShadow: patchMode === key ? "0 0 0 1px rgba(125,217,74,0.3)" : "none",
                    }}>
                    <div style={{ color: patchMode === key ? "#7dd94a" : "rgba(255,255,255,0.55)" }}>{icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: "#f0f8ec" }}>{label}</span>
                        {recommended && <span className="text-[9px] px-1 py-0.5 rounded font-medium" style={{ background: "rgba(125,217,74,0.2)", color: "#9fe066" }}>✓ Recommended</span>}
                      </div>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowPatchModal(false)}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95"
                style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.04)" }}>
                Cancel
              </button>
              <button onClick={handleConfirmPatch}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: "#5aaa28", color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#6abf32")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#5aaa28")}
              >
                Deploy {patchMode === "silent" ? "Silent" : patchMode === "managed" ? "Managed" : "User Prompted"} 🌳
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
        style={{ background: "#5aaa28", transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)", opacity: toastMsg ? 1 : 0, transform: toastMsg ? "translateY(0)" : "translateY(-120%)", pointerEvents: toastMsg ? "auto" : "none" }}>
        <span>🌳</span>
        {toastMsg}
      </div>
    </div>
  );
}
