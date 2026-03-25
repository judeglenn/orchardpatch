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

const COLORS = ["#2d5016", "#ff9800", "#4caf50", "#64b5f6", "#f44336", "#90caf9", "#ab47bc", "#26a69a"];

type PatchMode = "silent" | "managed" | "prompted";

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

  const app = getAppById(id) ?? getAgentApp(id);
  const safeApp = app;

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

  function handleConfirmPatch() {
    setShowPatchModal(false);
    const target = patchDeviceId ? `1 device` : `all ${installations.length} device${installations.length !== 1 ? "s" : ""}`;
    showToast(`${safeApp?.name} queued for ${patchMode} patch on ${target} (coming soon)`);
    setPatchDeviceId(null);
  }

  if (!agentLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-[#2d5016] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!safeApp) {
    return (
      <div className="px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-5" style={{ color: "#6b7280" }}>
          <ChevronLeft className="h-4 w-4" /> App Inventory
        </Link>
        <div className="text-center py-20">
          <p className="text-lg font-semibold" style={{ color: "#1a1a2e" }}>App not found</p>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>This app may not be in the current inventory.</p>
        </div>
      </div>
    );
  }

  const initials = appInitials(safeApp.name);
  const colorClass = appColorClass(safeApp.name);

  return (
    <div className="px-6 py-6">
      {/* Back button */}
      <div className="mb-5">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "#6b7280" }}>
          <ChevronLeft className="h-4 w-4" />
          App Inventory
        </Link>
      </div>

      {/* App header */}
      <div className="flex items-center gap-5 mb-6 rounded-lg border bg-white px-6 py-5" style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white text-xl font-bold shadow-sm ${colorClass}`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>{app.name}</h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#f0f7e8", color: "#2d5016" }}>{app.category}</span>
            {app.hasVersionConflict ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fff3e0", color: "#e65100" }}>
                <AlertTriangle className="h-3 w-3" />
                Outdated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                <CheckCircle2 className="h-3 w-3" />
                No Conflicts
              </span>
            )}
          </div>
          <p className="text-xs font-mono mb-2" style={{ color: "#6b7280" }}>{app.bundleId}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "#6b7280" }}>
            <span className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              <strong style={{ color: "#1a1a2e" }}>{app.totalInstalls}</strong>&nbsp;installs
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
            style={{ background: "#2d5016", color: "white" }}
          >
            🍎 Patch All
          </button>
        )}
      </div>

      {/* Outdated / No Conflicts banner */}
      {app.hasVersionConflict ? (
        <div className="mb-6 flex items-start gap-3 rounded-lg px-4 py-3.5" style={{ background: "#fff8e1", border: "1px solid #ffe082" }}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#f9a825" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e65100" }}>Outdated version detected</p>
            <p className="text-xs mt-0.5" style={{ color: "#bf360c" }}>
              Installed version is <strong className="font-mono">{app.mostCommonVersion}</strong>.
              {(app as any).latestVersion && (
                <> Latest available is <strong className="font-mono">{(app as any).latestVersion}</strong>.</>
              )}
              {" "}Consider patching.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-lg px-4 py-3.5" style={{ background: "#f1f8e9", border: "1px solid #c5e1a5" }}>
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#43a047" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#2e7d32" }}>No version conflicts</p>
            <p className="text-xs mt-0.5" style={{ color: "#388e3c" }}>
              All {app.totalInstalls} device{app.totalInstalls !== 1 ? "s" : ""} are running <strong className="font-mono">{app.mostCommonVersion}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Patch This App */}
      <div className="mb-6 rounded-lg border bg-white overflow-hidden" style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #e2e4e7" }}>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: "#2d5016" }} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#6b7280" }}>Patch Policies</p>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
            Choose how updates are deployed to devices running {app.name}.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "#e2e4e7" }}>
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
              icon: <Bell className="h-4 w-4" style={{ color: "#2d5016" }} />,
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
            <div key={key} className="p-5 flex flex-col gap-3" style={{ background: key === "managed" ? "#fafffe" : undefined }}>
              <div className="flex items-center gap-2">
                <span style={{ color: key === "managed" ? "#2d5016" : "#6b7280" }}>{icon}</span>
                <span className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>{label}</span>
                {recommended && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#f0f7e8", color: "#2d5016" }}>Recommended</span>
                )}
              </div>
              <p className="text-xs" style={{ color: "#6b7280" }}>{description}</p>
              <div className="text-[10px] font-mono rounded px-2 py-1" style={{ background: "#f3f4f6", color: "#6b7280" }}>{flags}</div>
              {active ? (
                <button
                  onClick={() => { setPatchMode(key); setPatchDeviceId(null); setShowPatchModal(true); }}
                  className="mt-auto w-full text-xs font-semibold py-2 rounded-md transition-all active:scale-95"
                  style={{
                    background: key === "managed" ? "#2d5016" : "#1a2e0d",
                    color: "white",
                    border: "none",
                  }}
                >
                  Deploy {label} 🍎
                </button>
              ) : (
                <button
                  className="mt-auto w-full text-xs font-semibold py-2 rounded-md cursor-not-allowed"
                  style={{ background: "#f3f4f6", color: "#9ca3af", border: "1px solid #e2e4e7" }}
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
          <div className="rounded-lg border bg-white p-5" style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: "#6b7280" }}>Version Distribution</p>
            <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>Devices per installed version</p>
            <VersionChartWrapper versions={app.versions} />
          </div>
          <div className="rounded-lg border bg-white p-5" style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: "#6b7280" }}>Version Breakdown</p>
            <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>{app.versions.length} version{app.versions.length !== 1 ? "s" : ""} detected</p>
            <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
              {app.versions.map((v, i) => {
                const pct = Math.round((v.deviceCount / app.totalInstalls) * 100);
                return (
                  <div key={v.version} className="flex items-center gap-3 py-2.5">
                    <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-medium" style={{ color: "#1a1a2e" }}>{v.version}</span>
                        {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#f0f7e8", color: "#2d5016" }}>Installed</span>}
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                    <span className="text-xs shrink-0 w-28 text-right" style={{ color: "#6b7280" }}>
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
      <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #e2e4e7" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#6b7280" }}>Installed Devices</p>
          <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
            {installations.length} device{installations.length !== 1 ? "s" : ""} with {app.name} installed
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderColor: "#e2e4e7" }}>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#6b7280", background: "#fafafa" }}>Device Name</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#6b7280", background: "#fafafa" }}>Installed Version</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#6b7280", background: "#fafafa" }}>Last Inventory</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-right" style={{ color: "#6b7280", background: "#fafafa" }}>Patch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installations.map((inst, idx) => (
                <TableRow key={inst.deviceId} className="group" style={{ background: idx % 2 === 1 ? "#fafafa" : "#ffffff", borderColor: "#f3f4f6" }}>
                  <TableCell>
                    <Link href={`/devices/${inst.deviceId}`} className="font-medium text-sm flex items-center gap-2 transition-colors text-[#1a1a2e] hover:text-[#2d5016]">
                      <Monitor className="h-3.5 w-3.5 shrink-0" style={{ color: "#9ca3af" }} />
                      {inst.deviceName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={
                      app.hasVersionConflict
                        ? { background: "#fff3e0", color: "#e65100" }
                        : { color: "#6b7280" }
                    }>
                      {inst.version}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: "#6b7280" }}>{formatDate(inst.lastInventory)}</TableCell>
                  <TableCell className="text-right">
                    {app.hasVersionConflict ? (
                      <button
                        onClick={() => { setPatchDeviceId(inst.deviceId); setShowPatchModal(true); }}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all hover:opacity-80 active:scale-95"
                        style={{ background: "#2d5016", color: "white" }}
                      >
                        🍎 Patch
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "#eef0f2", color: "#9ca3af" }}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPatchModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div className="px-6 pt-6 pb-4 border-b flex items-start justify-between" style={{ borderColor: "#e2e4e7" }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🍎</span>
                  <h2 className="text-base font-bold" style={{ color: "#1a1a2e" }}>Patch by the Fruit</h2>
                </div>
                <p className="text-sm font-medium" style={{ color: "#2d5016" }}>{app.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                  {patchDeviceId ? "1 device selected" : `All ${installations.length} device${installations.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button onClick={() => setShowPatchModal(false)} style={{ color: "#9ca3af" }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: "#6b7280" }}>Patch Mode</p>
              <div className="flex flex-col gap-2">
                {([
                  { key: "silent" as PatchMode, icon: <BellOff className="h-3.5 w-3.5" />, label: "Silent", sub: "Force quit, no prompts", recommended: false },
                  { key: "managed" as PatchMode, icon: <Bell className="h-3.5 w-3.5" />, label: "Managed", sub: "Notify, must comply", recommended: true },
                  { key: "prompted" as PatchMode, icon: <MessageSquare className="h-3.5 w-3.5" />, label: "User Prompted", sub: "User chooses when", recommended: false },
                ] as const).map(({ key, icon, label, sub, recommended }) => (
                  <button key={key} onClick={() => setPatchMode(key)}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all"
                    style={{ borderColor: patchMode === key ? "#2d5016" : "#e2e4e7", background: patchMode === key ? "#f0f7e8" : "white", boxShadow: patchMode === key ? "0 0 0 1px #2d5016" : "none" }}>
                    <div style={{ color: patchMode === key ? "#2d5016" : "#6b7280" }}>{icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: "#1a1a2e" }}>{label}</span>
                        {recommended && <span className="text-[9px] px-1 py-0.5 rounded font-medium" style={{ background: "#d4edda", color: "#2d5016" }}>✓ Recommended</span>}
                      </div>
                      <span className="text-[10px]" style={{ color: "#9ca3af" }}>{sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowPatchModal(false)}
                className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all active:scale-95"
                style={{ borderColor: "#e2e4e7", color: "#6b7280" }}>
                Cancel
              </button>
              <button onClick={handleConfirmPatch}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: "#2d5016", color: "white" }}>
                Deploy {patchMode === "silent" ? "Silent" : patchMode === "managed" ? "Managed" : "User Prompted"} 🌳
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
        style={{ background: "#2d5016", transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)", opacity: toastMsg ? 1 : 0, transform: toastMsg ? "translateY(0)" : "translateY(-120%)", pointerEvents: toastMsg ? "auto" : "none" }}>
        <span>🌳</span>
        {toastMsg}
      </div>
    </div>
  );
}
