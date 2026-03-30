"use client";

import { use, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDeviceById, getAppById } from "@/lib/mockData";
import { getAgentDevice, getAgentApp, getLatestVersion } from "@/lib/agentStore";
import { SearchBar } from "@/components/SearchBar";
import { VersionBadge } from "@/components/VersionBadge";
import { formatDate, formatRelativeDate, appInitials, appColorClass, macOSName } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, Cpu, HardDrive, Clock, Package, Zap, BellOff, Bell, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

export default function DeviceDetailPage({ params }: Props) {
  const { id } = use(params);
  const device = getDeviceById(id) ?? getAgentDevice(id);
  if (!device) notFound();

  const [search, setSearch] = useState("");
  const [patchTarget, setPatchTarget] = useState<{ appId: string; appName: string } | null>(null);
  const [patchMode, setPatchMode] = useState<"silent" | "managed" | "prompted">("managed");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }


  const filteredApps = useMemo(() => {
    if (!search.trim()) return device.apps;
    const q = search.toLowerCase();
    return device.apps.filter(
      (a) =>
        a.appName.toLowerCase().includes(q) || a.version.toLowerCase().includes(q)
    );
  }, [device.apps, search]);

  const glassPanel = {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
  };

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
      <div
        className="flex items-center gap-5 mb-6 rounded-2xl px-6 py-5"
        style={glassPanel}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          style={{ background: "rgba(125,217,74,0.2)", border: "1px solid rgba(125,217,74,0.3)" }}
        >
          <Cpu className="h-7 w-7" style={{ color: "#7dd94a" }} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold font-mono mb-1" style={{ color: "#f0f8ec" }}>
            {device.name}
          </h1>
          <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
            {device.model}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              macOS {macOSName(device.osVersion) ? `${macOSName(device.osVersion)} ` : ""}{device.osVersion}
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              <strong style={{ color: "#f0f8ec" }}>{device.apps.length}</strong>&nbsp;apps installed
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Last inventory{" "}
              <strong style={{ color: "#f0f8ec" }}>{formatRelativeDate(device.lastInventory)}</strong>
              &nbsp;
              <span className="text-xs">({formatDate(device.lastInventory)})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Apps table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={glassPanel}
      >
        <div
          className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex-1">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Installed Apps
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {filteredApps.length === device.apps.length
                ? `${device.apps.length} apps`
                : `${filteredApps.length} of ${device.apps.length} apps`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              style={{ background: "#5aaa28", color: "white", borderColor: "#5aaa28" }}
              onClick={() => {
                const outdated = filteredApps.filter((a) => {
                  const meta = getAppById(a.appId);
                  return meta && a.version !== meta.mostCommonVersion;
                });
                if (outdated.length === 0) {
                  alert("All apps are up to date!");
                } else {
                  alert(`Patching ${outdated.length} outdated app${outdated.length !== 1 ? "s" : ""}... (coming soon)`);
                }
              }}
            >
              <Zap className="h-3.5 w-3.5" />
              Patch All Outdated 🍎
            </Button>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Filter apps…"
              className="sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}
                >
                  App Name
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}
                >
                  Installed
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}
                >
                  Latest
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}
                >
                  Category
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}
                >
                  Status
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-right"
                  style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.2)" }}
                >
                  Patch
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.length > 0 ? (
                filteredApps.map((appInst, idx) => {
                  const appMeta = getAppById(appInst.appId) ?? getAgentApp(appInst.appId);
                  const initials = appInitials(appInst.appName);
                  const colorClass = appColorClass(appInst.appName);
                  const isOutdated = appMeta?.hasVersionConflict ?? false;

                  return (
                    <TableRow
                      key={appInst.appId}
                      className="group"
                      style={{
                        background: idx % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                        borderColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <TableCell>
                        <Link
                          href={`/apps/${appInst.appId}`}
                          className="flex items-center gap-3 transition-colors"
                          style={{ color: "#f0f8ec" }}
                        >
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold ${colorClass}`}
                          >
                            {initials}
                          </div>
                          <span className="text-sm font-medium">{appInst.appName}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-mono text-xs px-2 py-0.5 rounded"
                          style={
                            isOutdated
                              ? { background: "rgba(255,160,0,0.12)", color: "#ffb74d", border: "1px solid rgba(255,160,0,0.3)" }
                              : { color: "rgba(255,255,255,0.55)" }
                          }
                        >
                          {appInst.version}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {(() => {
                          const latest = (appMeta as any)?.latestVersion ?? getLatestVersion(appInst.appId.replace(/-/g, "."));
                          return latest ? (
                            <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(125,217,74,0.12)", color: "#9fe066", border: "1px solid rgba(125,217,74,0.3)" }}>
                              {latest}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell
                        className="hidden sm:table-cell text-xs"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      >
                        {appMeta?.category ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {appMeta && (
                          <VersionBadge
                            hasConflict={isOutdated ?? false}
                            className="text-[10px]"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isOutdated ? (
                          <button
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all hover:opacity-80 active:scale-95"
                            style={{ background: "#5aaa28", color: "white" }}
                            onClick={() => setPatchTarget({ appId: appInst.appId, appName: appInst.appName })}
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
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-sm"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    No apps match your search
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
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>on {device.name}</p>
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
                        {recommended && <span className="text-[9px] px-1 py-0.5 rounded font-medium" style={{ background: "rgba(125,217,74,0.2)", color: "#9fe066" }}>✓ Recommended</span>}
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
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: "#5aaa28", color: "white" }}
                onClick={() => {
                  setPatchTarget(null);
                  showToast(`${patchTarget.appName} queued for patching (coming soon)`);
                }}
              >
                Patch Now 🍎
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
