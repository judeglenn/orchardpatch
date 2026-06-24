"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAppById, getAppInstallations } from "@/lib/mockData";
import { getAgentApp, getAgentStore } from "@/lib/agentStore";
import { formatDateTime } from "@/lib/utils";
import { Topbar } from "@/components/Topbar";
import { X } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

type PatchMode = "silent" | "managed" | "prompted";

const INSTALLOMATOR_LABELS: Record<string, string> = {
  "org.mozilla.firefox": "firefoxpkg",
  "org.mozilla.firefoxpkg": "firefoxpkg",
  "com.google.Chrome": "googlechromepkg",
  "com.microsoft.edgemac": "microsoftedge",
  "com.brave.Browser": "brave",
  "com.operasoftware.Opera": "opera",
  "com.apple.Safari": "safari",
  "us.zoom.xos": "zoom",
  "com.tinyspeck.slackmacgap": "slack",
  "com.microsoft.teams2": "microsoftteams",
  "com.cisco.webex.meetings": "webex",
  "com.discord.Discord": "discord",
  "com.hnc.Discord": "discord",
  "com.skype.skype": "skype",
  "ru.keepcoder.Telegram": "telegram",
  "com.loom.desktop": "loom",
  "com.microsoft.Word": "microsoftword",
  "com.microsoft.Excel": "microsoftexcel",
  "com.microsoft.Powerpoint": "microsoftpowerpoint",
  "com.microsoft.Outlook": "microsoftoutlook",
  "com.microsoft.onenote.mac": "microsoftonenote",
  "com.microsoft.OneDrive": "onedrive",
  "com.microsoft.rdc.macos": "microsoftremotedesktop",
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

function displayVersion(v: string) { return v ? v.split(",")[0] : v; }

// ---- Style helpers ----
const cardStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  backgroundColor: "var(--surface-glass)",
  backgroundImage: "var(--sheen)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  backdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid var(--border-hairline)",
  borderRadius: "var(--r-xl)",
  boxShadow: "var(--shadow-card)",
  padding: "24px",
  marginBottom: 18,
  transition: "background-color 0.5s, box-shadow 0.5s",
};

const cardHead: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18,
};

function StatusPill({ status }: { status: "current" | "patchable" | "unknown" | "lagging" }) {
  const configs = {
    current:  { bg: "var(--st-current-tint)",  text: "var(--st-current-text)",  dot: "var(--st-current)",  label: "Up to date" },
    patchable:{ bg: "var(--st-outdated-tint)", text: "var(--st-outdated-text)", dot: "var(--st-outdated)", label: "Patchable" },
    lagging:  { bg: "var(--st-lagging-tint)",  text: "var(--st-lagging-text)",  dot: "var(--st-lagging)",  label: "Lagging" },
    unknown:  { bg: "var(--st-unknown-tint)",  text: "var(--st-unknown-text)",  dot: "var(--st-unknown)",  label: "Unknown" },
  };
  const c = configs[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 12, fontWeight: 600, padding: "4px 11px",
      borderRadius: "var(--r-pill)",
      background: c.bg, color: c.text,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {c.label}
    </span>
  );
}

function DeviceStatusPill({ status }: { status: string }) {
  if (status === "outdated") return <StatusPill status="patchable" />;
  if (status === "current")  return <StatusPill status="current" />;
  if (status === "unknown")  return <StatusPill status="unknown" />;
  return null;
}

// ---- Main page ----
export default function AppDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [fleetApp, setFleetApp] = useState<any>(null);
  const [fleetInstallations, setFleetInstallations] = useState<any[] | null>(null);
  const [fleetLoaded, setFleetLoaded] = useState(false);
  const [agentLoaded, setAgentLoaded] = useState(false);
  const [agentFetched, setAgentFetched] = useState(false);
  const [patchHistory, setPatchHistory] = useState<any[]>([]);

  // Try fleet server first
  useEffect(() => {
    fetch(`/api/fleet/apps/${encodeURIComponent(id)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.app) {
          setFleetApp(data.app);
          setFleetInstallations(data.installations || []);
        }
      })
      .catch(() => {})
      .finally(() => setFleetLoaded(true));
  }, [id]);

  // Agent fallback
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

  // Load recent patch history for this app
  useEffect(() => {
    fetch(`/api/patch-jobs?limit=10`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.jobs) {
          // Filter to this app by bundle ID or name match
          const appId = id.replace(/-/g, ".").toLowerCase();
          const filtered = data.jobs.filter((j: any) =>
            (j.bundleId || "").toLowerCase() === appId ||
            (j.label || "").toLowerCase().includes(id.replace(/-/g, "").toLowerCase())
          ).slice(0, 5);
          setPatchHistory(filtered);
        }
      })
      .catch(() => {});
  }, [id]);

  // Modal state
  const [showPatchModal, setShowPatchModal] = useState(false);
  const [patchMode, setPatchMode] = useState<PatchMode>("managed");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [patchDeviceId, setPatchDeviceId] = useState<string | null>(null);
  const [showBushelModal, setShowBushelModal] = useState(false);
  const [bushelMode, setBushelMode] = useState<PatchMode>("managed");
  const [bushelLoading, setBushelLoading] = useState(false);

  // Resolve app data
  let app = fleetApp ?? getAppById(id) ?? getAgentApp(id);
  if (!app && id.includes("-")) {
    const bundleIdPattern = id.replace(/-/g, ".");
    const { apps: mockApps } = require("@/lib/mockData");
    app = mockApps.find((a: any) => a.bundleId.toLowerCase() === bundleIdPattern.toLowerCase());
  }

  const agentStore = getAgentStore();
  const installations = fleetInstallations ?? (
    getAppInstallations(id).length > 0
      ? getAppInstallations(id)
      : (agentStore.devices ?? []).flatMap(d =>
          d.apps
            .filter(a => a.appId === id)
            .map(a => ({
              deviceId: d.id,
              deviceName: d.name,
              version: a.version,
              lastInventory: d.lastInventory,
              isOutdated: false,
              label: undefined,
            }))
        )
  );

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function handleConfirmPatch() {
    setShowPatchModal(false);
    if (!app) return;
    let label: string | null = null;
    if (patchDeviceId && fleetInstallations) {
      const inst = fleetInstallations.find(i => i.deviceId === patchDeviceId);
      if (inst?.label) label = inst.label;
    } else if (fleetInstallations?.length) {
      const first = fleetInstallations.find(i => i.label);
      if (first) label = first.label;
    }
    if (!label) label = getInstallomatorLabel(app.bundleId);
    if (!label) { showToast(`No Installomator label found for ${app.name}`); return; }
    showToast(`Queuing ${patchMode} patch for ${app.name}…`);
    try {
      const res = await fetch("/api/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleId: app.bundleId, label, appName: app.name, mode: patchMode, deviceId: patchDeviceId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(`${data.error || "Patch failed to queue"}`); return; }
      showToast(`Patch job queued — redirecting…`);
      setTimeout(() => {
        const p = new URLSearchParams();
        p.set("method", "fruit");
        if (patchDeviceId) p.set("device_id", patchDeviceId);
        router.push(`/patches?${p.toString()}`);
      }, 800);
    } catch {
      showToast(`Agent not reachable — is it running?`);
    }
    setPatchDeviceId(null);
  }

  async function handleConfirmBushelPatch() {
    setShowBushelModal(false);
    if (!app) return;
    const outdatedDevices = installations.filter(i => i.isOutdated);
    if (!outdatedDevices.length) { showToast(`No outdated devices for ${app.name}`); return; }
    let label: string | null = null;
    const firstOutdated = fleetInstallations?.find(i => i.isOutdated);
    if (firstOutdated?.label) label = firstOutdated.label;
    if (!label) label = getInstallomatorLabel(app.bundleId);
    if (!label) { showToast(`No Installomator label found for ${app.name}`); return; }
    showToast(`Queuing ${bushelMode} patch for ${app.name} on ${outdatedDevices.length} device${outdatedDevices.length !== 1 ? "s" : ""}…`);
    try {
      setBushelLoading(true);
      const res = await fetch("/api/patch-jobs/bushel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, mode: bushelMode }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(`${data.error || "Patch failed to queue"}`); return; }
      showToast(`Patch jobs queued (${data.queued} device${data.queued !== 1 ? "s" : ""}) — redirecting…`);
      setTimeout(() => {
        window.location.href = `/patches?method=bushel&label=${encodeURIComponent(label!)}`;
      }, 800);
    } catch {
      showToast(`Server error — could not queue patches`);
    } finally {
      setBushelLoading(false);
    }
  }

  // Loading state
  if (!app && !fleetLoaded) {
    return (
      <>
        <Topbar type="app-detail" appName="Loading…" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text-tertiary)" }}>
          Loading…
        </div>
      </>
    );
  }

  // Not found
  if (!app) {
    return (
      <>
        <Topbar type="app-detail" appName="Not found" />
        <div style={{ padding: "26px 30px", textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>App not found</p>
          <p style={{ fontSize: 13, marginTop: 4, color: "var(--text-secondary)" }}>This app may not be in the current inventory.</p>
        </div>
      </>
    );
  }

  const initials = app.name.charAt(0).toUpperCase();
  const outdatedDevices = installations.filter((i: any) => i.isOutdated);
  const patchableVersion = displayVersion(app.latestVersion || "");

  // Determine overall version status
  type VersionState = "current" | "patchable" | "unknown";
  let versionState: VersionState = "unknown";
  if (installations.length > 0) {
    if (app.hasVersionConflict) versionState = "patchable";
    else if (installations.every((i: any) => i.patchStatus === "current" || (!i.patchStatus && !i.isOutdated))) versionState = "current";
    else if (installations.some((i: any) => i.patchStatus === "unknown")) versionState = "unknown";
    else versionState = "current";
  }

  // Installed version display: single if uniform, range if diverged
  const uniqueVersions = [...new Set(installations.map((i: any) => displayVersion(i.version)))];
  const installedDisplay = uniqueVersions.length === 1
    ? uniqueVersions[0]
    : uniqueVersions.length > 1
      ? `${uniqueVersions[uniqueVersions.length - 1]}–${uniqueVersions[0]}`
      : "—";

  // Installomator label chip text
  const installomatorLabel = app.label || getInstallomatorLabel(app.bundleId) || null;

  return (
    <>
      <Topbar type="app-detail" appName={app.name} />

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          background: "var(--surface-solid)",
          border: "1px solid var(--border-hairline)",
          borderRadius: "var(--r-md)",
          boxShadow: "var(--shadow-card)",
          padding: "12px 16px",
          fontSize: 13, color: "var(--text-primary)",
          maxWidth: 360,
        }}>
          {toastMsg}
        </div>
      )}

      <div style={{ padding: "26px 30px 48px", maxWidth: 1180, width: "100%" }}>

        {/* Identity header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 22 }}>
          {/* Avatar */}
          <div style={{
            width: 58, height: 58, borderRadius: 15, flexShrink: 0,
            display: "grid", placeItems: "center",
            fontSize: 24, fontWeight: 600,
            color: "var(--accent)",
            background: "var(--accent-tint)",
            boxShadow: "inset 0 1px 0 var(--rim-top), inset 0 0 0 1px rgba(98,184,106,0.14)",
          }}>
            {initials}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{app.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginTop: 8 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text-tertiary)" }}>{app.bundleId}</span>
              {app.bundleId && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-tertiary)", opacity: 0.5, display: "inline-block" }} />}
              {installomatorLabel && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 500, padding: "4px 10px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--surface-glass)",
                  border: "1px solid var(--border-hairline)",
                  color: "var(--text-secondary)",
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                    <path d="M4 7h16M4 12h16M4 17h10"/>
                  </svg>
                  {installomatorLabel}
                </span>
              )}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 500, padding: "4px 10px",
                borderRadius: "var(--r-pill)",
                background: "var(--surface-glass)",
                border: "1px solid var(--border-hairline)",
                color: "var(--accent)",
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                  <path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>
                </svg>
                via Installomator
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 500, padding: "4px 10px",
                borderRadius: "var(--r-pill)",
                background: "var(--surface-glass)",
                border: "1px solid var(--border-hairline)",
                color: "var(--text-secondary)",
              }}>
                {installations.length} device{installations.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {app.hasVersionConflict && outdatedDevices.length > 0 && (
              <button
                onClick={() => { setBushelMode("managed"); setShowBushelModal(true); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 9,
                  fontSize: 14, fontWeight: 600, color: "#fff",
                  letterSpacing: "-0.005em",
                  background: "var(--accent-grad)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: "var(--r-md)",
                  padding: "11px 18px",
                  boxShadow: "var(--shadow-accent)",
                  cursor: "pointer",
                  transition: "filter 0.14s, transform 0.08s",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v5h-5"/>
                </svg>
                Patch all outdated
              </button>
            )}
            <button
              aria-label="More"
              style={{
                width: 40, height: 40,
                borderRadius: "var(--r-md)",
                display: "grid", placeItems: "center",
                background: "var(--surface-glass)",
                border: "1px solid var(--border-hairline)",
                boxShadow: "inset 0 1px 0 var(--rim-top)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "background 0.14s",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Version hero card */}
        <div style={cardStyle}>
          <div style={cardHead}>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Version status</span>
            <StatusPill status={versionState === "patchable" ? "patchable" : versionState === "current" ? "current" : "unknown"} />
          </div>

          {versionState === "unknown" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-tertiary)", padding: "12px 0" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                <circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 6 0c0 2-3 3-3 3M12 17h.01"/>
              </svg>
              <span style={{ fontSize: 14 }}>Version data unavailable</span>
            </div>
          )}

          {versionState === "current" && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 22, flexWrap: "wrap" as const }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "var(--text-tertiary)" }}>Installed</span>
                <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {installedDisplay}
                </span>
                {installations.length > 1 && (
                  <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontWeight: 500, marginTop: 2 }}>
                    across {installations.length} devices
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 6, color: "var(--st-current-text)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                  <circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>
                </svg>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Up to date</span>
              </div>
            </div>
          )}

          {versionState === "patchable" && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 22, flexWrap: "wrap" as const }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "var(--text-tertiary)" }}>Installed</span>
                <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {installedDisplay}
                </span>
                {installations.length > 1 && (
                  <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontWeight: 500, marginTop: 2 }}>
                    across {installations.length} devices
                  </span>
                )}
              </div>
              {patchableVersion && (
                <>
                  <span style={{ fontSize: 22, color: "var(--text-tertiary)", paddingBottom: 6 }}>→</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "var(--text-tertiary)" }}>Patchable</span>
                    <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: "var(--st-outdated-text)" }}>
                      {patchableVersion}
                    </span>
                    <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontWeight: 500, marginTop: 2 }}>newest Installomator can install</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Fleet installations card */}
        <div style={cardStyle}>
          <div style={cardHead}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
                Installed on {installations.length} device{installations.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span style={{ fontSize: 12.5, color: "var(--text-tertiary)", fontWeight: 500 }}>
              Patch a single device, or use Patch all outdated above
            </span>
          </div>

          {installations.length === 0 ? (
            <p style={{ color: "var(--text-tertiary)", fontSize: 13 }}>No installations found.</p>
          ) : installations.map((inst: any) => (
            <div key={inst.deviceId} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "15px 6px",
              borderBottom: "1px solid var(--border-hairline)",
            }}>
              {/* Device icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                display: "grid", placeItems: "center",
                background: "var(--surface-sunken)",
                border: "1px solid var(--border-hairline)",
                color: "var(--text-secondary)",
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 19, height: 19 }}>
                  <rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>
                </svg>
              </div>

              {/* Device meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                  <Link href={fleetInstallations ? `/fleet/devices/${inst.deviceId}` : `/devices/${inst.deviceId}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {inst.deviceName}
                  </Link>
                </div>
                {(inst.model || inst.osVersion) && (
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1 }}>
                    {inst.model}{inst.model && inst.osVersion ? " · " : ""}{inst.osVersion}
                  </div>
                )}
              </div>

              {/* Version */}
              <div style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 500, fontVariantNumeric: "tabular-nums", minWidth: 64, color: "var(--text-primary)" }}>
                {displayVersion(inst.version)}
              </div>

              {/* Status pill */}
              <div style={{ minWidth: 108 }}>
                <DeviceStatusPill status={inst.patchStatus || (inst.isOutdated ? "outdated" : "current")} />
              </div>

              {/* Last checked */}
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", minWidth: 84 }}>
                {formatDateTime(inst.lastInventory)}
              </div>

              {/* Action */}
              <div style={{ minWidth: 142, display: "flex", justifyContent: "flex-end" }}>
                {inst.source === "mas" ? (
                  <span style={{ fontSize: 12.5, color: "var(--text-tertiary)", fontWeight: 500 }}>App Store</span>
                ) : inst.isOutdated ? (
                  <button
                    onClick={() => { setPatchDeviceId(inst.deviceId); setShowPatchModal(true); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      fontSize: 12.5, fontWeight: 600, color: "#fff",
                      background: "var(--accent-grad)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      borderRadius: "var(--r-sm)",
                      padding: "8px 13px",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 16px -8px var(--accent-glow)",
                      cursor: "pointer",
                      transition: "filter 0.14s, transform 0.08s",
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                      <path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v5h-5"/>
                    </svg>
                    Patch to {patchableVersion || "latest"}
                  </button>
                ) : app.hasVersionConflict ? (
                  <span style={{ fontSize: 12.5, color: "var(--text-tertiary)", fontWeight: 500 }}>On newest patchable</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Patch history card */}
        <div style={cardStyle}>
          <div style={cardHead}>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Patch history</span>
            <Link href="/patches" style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500 }}>
              View all in Patch History
            </Link>
          </div>
          {patchHistory.length === 0 ? (
            <p style={{ color: "var(--text-tertiary)", fontSize: 13 }}>No recent patch history for this app.</p>
          ) : patchHistory.map((job: any) => (
            <div key={job.jobId} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "13px 6px",
              borderBottom: "1px solid var(--border-hairline)",
            }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", minWidth: 200, fontVariantNumeric: "tabular-nums" }}>
                {formatDateTime(job.startedAt || job.createdAt)}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", flex: 1, minWidth: 0 }}>{job.deviceName}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text-tertiary)", minWidth: 90 }}>
                {job.completedAt ? "→ " + (displayVersion(job.toVersion || "")) : ""}
              </div>
              <div style={{ minWidth: 96, display: "flex", justifyContent: "flex-end" }}>
                <StatusPill status={job.status === "success" ? "current" : "unknown"} />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Fruit (single device) patch modal */}
      {showPatchModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowPatchModal(false); }}
        >
          <div style={{
            background: "var(--surface-solid)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--shadow-card)",
            width: "100%", maxWidth: 400,
          }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-hairline)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Patch {app.name}</h2>
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                  {patchDeviceId ? "1 device selected" : `All ${installations.length} device${installations.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button onClick={() => setShowPatchModal(false)} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>Patch mode</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(["silent", "managed", "prompted"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPatchMode(mode)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px",
                      borderRadius: "var(--r-md)",
                      border: `1px solid ${patchMode === mode ? "var(--accent)" : "var(--border-hairline)"}`,
                      background: patchMode === mode ? "var(--accent-tint)" : "var(--surface-glass)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{mode}</span>
                    {mode === "managed" && <span style={{ fontSize: 11, color: "var(--accent)", marginLeft: "auto" }}>recommended</span>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-hairline)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowPatchModal(false)} style={{ padding: "9px 16px", borderRadius: "var(--r-md)", border: "1px solid var(--border-hairline)", background: "var(--surface-glass)", color: "var(--text-primary)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleConfirmPatch}
                style={{
                  padding: "9px 18px",
                  borderRadius: "var(--r-md)",
                  background: "var(--accent-grad)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "#fff",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  boxShadow: "var(--shadow-accent)",
                }}
              >
                Patch now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bushel (all outdated) patch modal */}
      {showBushelModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowBushelModal(false); }}
        >
          <div style={{
            background: "var(--surface-solid)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--shadow-card)",
            width: "100%", maxWidth: 480,
            maxHeight: "90vh", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-hairline)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Patch all outdated — {app.name}</h2>
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                  {outdatedDevices.length} outdated device{outdatedDevices.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button onClick={() => setShowBushelModal(false)} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              {outdatedDevices.map((inst: any) => (
                <div key={inst.deviceId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "var(--r-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)" }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{inst.deviceName}</p>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1, fontFamily: "var(--mono)" }}>v{displayVersion(inst.version)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-hairline)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>Patch mode</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(["silent", "managed", "prompted"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setBushelMode(mode)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px",
                      borderRadius: "var(--r-md)",
                      border: `1px solid ${bushelMode === mode ? "var(--accent)" : "var(--border-hairline)"}`,
                      background: bushelMode === mode ? "var(--accent-tint)" : "var(--surface-glass)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{mode}</span>
                    {mode === "managed" && <span style={{ fontSize: 11, color: "var(--accent)", marginLeft: "auto" }}>recommended</span>}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-hairline)", display: "flex", gap: 10, justifyContent: "flex-end", background: "var(--surface-sunken)" }}>
              <button onClick={() => setShowBushelModal(false)} style={{ padding: "9px 16px", borderRadius: "var(--r-md)", border: "1px solid var(--border-hairline)", background: "var(--surface-glass)", color: "var(--text-primary)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleConfirmBushelPatch}
                disabled={bushelLoading}
                style={{
                  padding: "9px 18px",
                  borderRadius: "var(--r-md)",
                  background: "var(--accent-grad)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "#fff",
                  fontSize: 13, fontWeight: 600,
                  cursor: bushelLoading ? "wait" : "pointer",
                  opacity: bushelLoading ? 0.7 : 1,
                  boxShadow: "var(--shadow-accent)",
                }}
              >
                {bushelLoading ? "Queuing…" : `Patch ${outdatedDevices.length} device${outdatedDevices.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
