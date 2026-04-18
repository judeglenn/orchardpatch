"use client";

import { use, useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { PatchStatusBadge, type PatchStatus } from "@/components/PatchStatusBadge";
import { formatDate, formatRelativeDate, appInitials, appColorClass, macOSName } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, Cpu, HardDrive, Clock, Package, Zap, BellOff, Bell, MessageSquare, X, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FLEET_SERVER_URL, FLEET_SERVER_TOKEN } from "@/lib/fleetServer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FleetApp {
  id: number;
  device_id: string;
  bundle_id: string;
  name: string;
  version: string;
  latest_version: string | null;
  last_checked: string | null;
  cache_age_seconds: number | null;
  label: string | null;
  patch_status: PatchStatus;
}

interface FleetDevice {
  id: string;
  hostname: string;
  serial: string | null;
  model: string | null;
  os_version: string | null;
  ram: string | null;
  cpu: string | null;
  agent_version: string | null;
  last_seen: string | null;
}

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeviceDetailPage({ params }: Props) {
  const { id } = use(params);

  const [device, setDevice] = useState<FleetDevice | null>(null);
  const [apps, setApps] = useState<FleetApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"outdated" | null>(null);
  const [patchTarget, setPatchTarget] = useState<{ bundleId: string; label: string | null; appName: string } | null>(null);
  const [patchMode, setPatchMode] = useState<"silent" | "managed" | "prompted">("managed");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [patching, setPatching] = useState(false);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { "x-orchardpatch-token": FLEET_SERVER_TOKEN };

      const [deviceRes, appsRes] = await Promise.all([
        fetch(`${FLEET_SERVER_URL}/devices/${encodeURIComponent(id)}`, { headers }),
        fetch(`${FLEET_SERVER_URL}/apps/status?device_id=${encodeURIComponent(id)}`, { headers }),
      ]);

      if (!deviceRes.ok) {
        if (deviceRes.status === 404) throw new Error("Device not found");
        throw new Error(`Failed to load device (${deviceRes.status})`);
      }
      if (!appsRes.ok) {
        throw new Error(`Failed to load app status (${appsRes.status})`);
      }

      const deviceData = await deviceRes.json();
      const appsData = await appsRes.json();

      console.log("[DeviceDetail] device:", deviceData?.id, deviceData?.hostname);
      console.log("[DeviceDetail] appsData keys:", Object.keys(appsData));
      console.log("[DeviceDetail] apps count:", appsData.apps?.length);
      console.log("[DeviceDetail] outdated:", appsData.apps?.filter((a: any) => a.patch_status === "outdated").map((a: any) => a.name));

      setDevice(deviceData);
      setApps(appsData.apps ?? []);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Derived state ──────────────────────────────────────────────────────────

  const filteredApps = useMemo(() => {
    let result = apps;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.name.toLowerCase().includes(q) || a.version.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter((a) => a.patch_status === statusFilter);
    }
    return result;
  }, [apps, search, statusFilter]);

  const outdatedCount = useMemo(
    () => apps.filter((a) => a.patch_status === "outdated").length,
    [apps]
  );

  const currentCount = useMemo(
    () => apps.filter((a) => a.patch_status === "current").length,
    [apps]
  );

  // ─── Patch handler ──────────────────────────────────────────────────────────

  async function handlePatchNow() {
    if (!patchTarget || !device) return;
    if (!patchTarget.label) {
      showToast("No Installomator label — can't patch this app");
      setPatchTarget(null);
      return;
    }
    setPatching(true);
    try {
      const res = await fetch(`${FLEET_SERVER_URL}/patch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-orchardpatch-token": FLEET_SERVER_TOKEN,
        },
        body: JSON.stringify({
          deviceId: device.id,
          bundleId: patchTarget.bundleId,
          label: patchTarget.label,
          appName: patchTarget.appName,
          mode: patchMode,
        }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      showToast(`${patchTarget.appName} queued for patching 🍎`);
    } catch (err: any) {
      showToast(`Failed to queue patch: ${err.message}`);
    } finally {
      setPatching(false);
      setPatchTarget(null);
    }
  }

  // ─── Styles ─────────────────────────────────────────────────────────────────

  const glassPanel = {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
  };

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="mb-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            <ChevronLeft className="h-4 w-4" /> App Inventory
          </Link>
        </div>
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────

  if (error || !device) {
    return (
      <div className="px-6 py-6">
        <div className="mb-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            <ChevronLeft className="h-4 w-4" /> App Inventory
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertTriangle className="h-10 w-10" style={{ color: "#ef5350" }} />
          <p className="text-base font-semibold" style={{ color: "#f0f8ec" }}>
            {error ?? "Device not found"}
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Could not load device <code className="font-mono text-xs">{id}</code> from fleet server.
          </p>
          <Button size="sm" onClick={loadData} className="mt-2" style={{ background: "#5aaa28", color: "white" }}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-6">
      {/* Back button */}
      <div className="mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <ChevronLeft className="h-4 w-4" />
          App Inventory
        </Link>
      </div>

      {/* Device header */}
      <div className="flex items-center gap-5 mb-6 rounded-2xl px-6 py-5" style={glassPanel}>
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          style={{ background: "rgba(125,217,74,0.2)", border: "1px solid rgba(125,217,74,0.3)" }}
        >
          <Cpu className="h-7 w-7" style={{ color: "#7dd94a" }} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold font-mono mb-1" style={{ color: "#f0f8ec" }}>
            {device.hostname}
          </h1>
          <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
            {device.model ?? "Unknown model"}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            {device.os_version && (
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5" />
                macOS {macOSName(device.os_version) ? `${macOSName(device.os_version)} ` : ""}{device.os_version}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              <strong style={{ color: "#f0f8ec" }}>{apps.length}</strong>&nbsp;apps installed
            </span>
            {outdatedCount > 0 && (
              <button
                onClick={() => setStatusFilter((f) => f === "outdated" ? null : "outdated")}
                className="flex items-center gap-1.5 font-semibold transition-all rounded px-1 -mx-1"
                style={{
                  color: "#ef5350",
                  outline: statusFilter === "outdated" ? "1px solid rgba(239,83,80,0.5)" : "none",
                  background: statusFilter === "outdated" ? "rgba(239,83,80,0.08)" : "transparent",
                }}
                title={statusFilter === "outdated" ? "Click to clear filter" : "Click to filter outdated apps"}
              >
                🔴 {outdatedCount} outdated
              </button>
            )}
            {outdatedCount === 0 && currentCount > 0 && (
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: "#9fe066" }}>
                ✅ All known apps up to date
              </span>
            )}
            {device.last_seen && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Last seen{" "}
                <strong style={{ color: "#f0f8ec" }}>{formatRelativeDate(device.last_seen)}</strong>
                &nbsp;
                <span className="text-xs">({formatDate(device.last_seen)})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Apps table */}
      <div className="rounded-2xl overflow-hidden" style={glassPanel}>
        <div
          className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.55)" }}>
              Installed Apps
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {filteredApps.length === apps.length
                ? `${apps.length} apps`
                : `${filteredApps.length} of ${apps.length} apps`}
              {outdatedCount > 0 && (
                <button
                  onClick={() => setStatusFilter((f) => f === "outdated" ? null : "outdated")}
                  className="ml-1 transition-colors hover:text-[#ef5350]"
                  style={{ color: statusFilter === "outdated" ? "#ef5350" : "rgba(255,255,255,0.35)" }}
                >
                  · {outdatedCount} outdated{statusFilter === "outdated" ? " ×" : ""}
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              style={{ background: "#5aaa28", color: "white", borderColor: "#5aaa28" }}
              onClick={() => {
                const outdated = filteredApps.filter((a) => a.patch_status === "outdated");
                if (outdated.length === 0) {
                  showToast("All apps are up to date!");
                } else {
                  showToast(`Queuing ${outdated.length} patch${outdated.length !== 1 ? "es" : ""}... (coming soon)`);
                }
              }}
            >
              <Zap className="h-3.5 w-3.5" />
              Patch All Outdated 🍎
            </Button>
            <SearchBar value={search} onChange={setSearch} placeholder="Filter apps…" className="sm:w-64" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                {["App Name", "Installed", "Latest", "Status", "Patch"].map((h, i) => (
                  <TableHead
                    key={h}
                    className={`text-[11px] font-semibold uppercase tracking-[0.08em]${i >= 1 && i <= 2 ? " hidden sm:table-cell" : ""}${i === 4 ? " text-right" : ""}`}
                    style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.length > 0 ? (
                filteredApps.map((app, idx) => {
                  const initials = appInitials(app.name);
                  const colorClass = appColorClass(app.name);
                  const isOutdated = app.patch_status === "outdated";

                  return (
                    <TableRow
                      key={app.id}
                      className="group"
                      style={{
                        background: idx % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                        borderColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* App name */}
                      <TableCell>
                        <Link
                          href={`/apps/${app.bundle_id?.replace(/\./g, '-').toLowerCase() ?? app.id}`}
                          className="flex items-center gap-3 group/link"
                        >
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold ${colorClass}`}>
                            {initials}
                          </div>
                          <span className="text-sm font-medium transition-colors group-hover/link:text-[#9fe066]" style={{ color: "#f0f8ec" }}>{app.name}</span>
                        </Link>
                      </TableCell>

                      {/* Installed version */}
                      <TableCell>
                        <span
                          className="font-mono text-xs px-2 py-0.5 rounded"
                          style={
                            isOutdated
                              ? { background: "rgba(239,83,80,0.12)", color: "#ef5350", border: "1px solid rgba(239,83,80,0.3)" }
                              : { color: "rgba(255,255,255,0.55)" }
                          }
                        >
                          {app.version}
                        </span>
                      </TableCell>

                      {/* Latest version */}
                      <TableCell className="hidden sm:table-cell">
                        {app.latest_version ? (
                          <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(125,217,74,0.12)", color: "#9fe066", border: "1px solid rgba(125,217,74,0.3)" }}>
                            {app.latest_version}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
                        )}
                      </TableCell>

                      {/* Status badge */}
                      <TableCell className="hidden sm:table-cell">
                        <PatchStatusBadge status={app.patch_status} latestVersion={app.latest_version} />
                      </TableCell>

                      {/* Patch button */}
                      <TableCell className="text-right">
                        {isOutdated ? (
                          <button
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all hover:opacity-80 active:scale-95"
                            style={{ background: "#5aaa28", color: "white" }}
                            onClick={() => setPatchTarget({ bundleId: app.bundle_id, label: app.label, appName: app.name })}
                          >
                            🍎 Patch
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}
                          >
                            Up to date
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {statusFilter
                      ? <>
                          No {statusFilter} apps match your search.{" "}
                          <button
                            onClick={() => setStatusFilter(null)}
                            className="underline transition-colors hover:text-[#9fe066]"
                          >
                            Clear filter
                          </button>
                        </>
                      : "No apps match your search"
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Patch by the Fruit modal */}
      {patchTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setPatchTarget(null); }}
        >
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
                <p className="text-sm font-medium" style={{ color: "#9fe066" }}>{patchTarget.appName}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>on {device.hostname}</p>
              </div>
              <button onClick={() => setPatchTarget(null)} style={{ color: "rgba(255,255,255,0.4)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>Patch Mode</p>
              <div className="flex flex-col gap-2">
                {[
                  { key: "silent" as const, icon: <BellOff className="h-3.5 w-3.5" />, label: "Silent", sub: "Force quit, no prompts" },
                  { key: "managed" as const, icon: <Bell className="h-3.5 w-3.5" />, label: "Managed", sub: "Notify, must comply", recommended: true },
                  { key: "prompted" as const, icon: <MessageSquare className="h-3.5 w-3.5" />, label: "User Prompted", sub: "User chooses when" },
                ].map(({ key, icon, label, sub, recommended }) => (
                  <button
                    key={key}
                    onClick={() => setPatchMode(key)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                    style={{
                      border: patchMode === key ? "1px solid rgba(125,217,74,0.5)" : "1px solid rgba(255,255,255,0.12)",
                      background: patchMode === key ? "rgba(125,217,74,0.12)" : "rgba(255,255,255,0.04)",
                      boxShadow: patchMode === key ? "0 0 0 1px rgba(125,217,74,0.3)" : "none",
                    }}
                  >
                    <div style={{ color: patchMode === key ? "#7dd94a" : "rgba(255,255,255,0.55)" }}>{icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: "#f0f8ec" }}>{label}</span>
                        {recommended && (
                          <span className="text-[9px] px-1 py-0.5 rounded font-medium" style={{ background: "rgba(125,217,74,0.2)", color: "#9fe066" }}>✓ Recommended</span>
                        )}
                      </div>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95"
                style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.04)" }}
                onClick={() => setPatchTarget(null)}
                disabled={patching}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "#5aaa28", color: "white" }}
                onClick={handlePatchNow}
                disabled={patching}
              >
                {patching ? "Queuing…" : "Patch Now 🍎"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
        style={{
          background: "#5aaa28",
          transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          opacity: toastMsg ? 1 : 0,
          transform: toastMsg ? "translateY(0)" : "translateY(-120%)",
          pointerEvents: toastMsg ? "auto" : "none",
        }}
      >
        <span>🍎</span>
        {toastMsg}
      </div>
    </div>
  );
}
