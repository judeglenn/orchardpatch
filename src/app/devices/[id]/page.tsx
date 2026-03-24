"use client";

import { use, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDeviceById, getAppById } from "@/lib/mockData";
import { getAgentDevice, getAgentApp } from "@/lib/agentStore";
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

  return (
    <div className="px-6 py-6">
      {/* Back button */}
      <div className="mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "#6b7280" }}
        >
          <ChevronLeft className="h-4 w-4" />
          App Inventory
        </Link>
      </div>

      {/* Device header */}
      <div
        className="flex items-center gap-5 mb-6 rounded-lg border bg-white px-6 py-5"
        style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          style={{ background: "#2d5016" }}
        >
          <Cpu className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold font-mono mb-1" style={{ color: "#1a1a2e" }}>
            {device.name}
          </h1>
          <p className="text-sm mb-2" style={{ color: "#6b7280" }}>
            {device.model}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "#6b7280" }}>
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              macOS {macOSName(device.osVersion) ? `${macOSName(device.osVersion)} ` : ""}{device.osVersion}
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              <strong style={{ color: "#1a1a2e" }}>{device.apps.length}</strong>&nbsp;apps installed
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Last inventory{" "}
              <strong style={{ color: "#1a1a2e" }}>{formatRelativeDate(device.lastInventory)}</strong>
              &nbsp;
              <span className="text-xs">({formatDate(device.lastInventory)})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Apps table */}
      <div
        className="rounded-lg border bg-white overflow-hidden"
        style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div
          className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ borderBottom: "1px solid #e2e4e7" }}
        >
          <div className="flex-1">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "#6b7280" }}
            >
              Installed Apps
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
              {filteredApps.length === device.apps.length
                ? `${device.apps.length} apps`
                : `${filteredApps.length} of ${device.apps.length} apps`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              style={{ background: "#2d5016", color: "white", borderColor: "#2d5016" }}
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
              <TableRow className="hover:bg-transparent" style={{ borderColor: "#e2e4e7" }}>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  App Name
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Installed
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Latest
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Category
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Status
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-right"
                  style={{ color: "#6b7280", background: "#fafafa" }}
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
                        background: idx % 2 === 1 ? "#fafafa" : "#ffffff",
                        borderColor: "#f3f4f6",
                      }}
                    >
                      <TableCell>
                        <Link
                          href={`/apps/${appInst.appId}`}
                          className="flex items-center gap-3 transition-colors text-[#1a1a2e] hover:text-[#2d5016]"
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
                              ? { background: "#fff3e0", color: "#e65100" }
                              : { color: "#6b7280" }
                          }
                        >
                          {appInst.version}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {(appMeta as any)?.latestVersion ? (
                          <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "#f0f7e8", color: "#2d5016" }}>
                            {(appMeta as any).latestVersion}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "#d1d5db" }}>—</span>
                        )}
                      </TableCell>
                      <TableCell
                        className="hidden sm:table-cell text-xs"
                        style={{ color: "#6b7280" }}
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
                            style={{ background: "#2d5016", color: "white" }}
                            onClick={() => setPatchTarget({ appId: appInst.appId, appName: appInst.appName })}
                          >
                            🍎 Patch
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ background: "#eef0f2", color: "#9ca3af" }}
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
                    style={{ color: "#6b7280" }}
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
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setPatchTarget(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div className="px-6 pt-6 pb-4 border-b flex items-start justify-between" style={{ borderColor: "#e2e4e7" }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🍎</span>
                  <h2 className="text-base font-bold" style={{ color: "#1a1a2e" }}>Patch by the Fruit</h2>
                </div>
                <p className="text-sm font-medium" style={{ color: "#2d5016" }}>{patchTarget.appName}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>on {device.name}</p>
              </div>
              <button onClick={() => setPatchTarget(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: "#6b7280" }}>Patch Mode</p>
              <div className="flex flex-col gap-2">
                {[
                  { key: "silent" as const, icon: <BellOff className="h-3.5 w-3.5" />, label: "Silent", sub: "Force quit, no prompts" },
                  { key: "managed" as const, icon: <Bell className="h-3.5 w-3.5" />, label: "Managed", sub: "Notify, must comply", recommended: true },
                  { key: "prompted" as const, icon: <MessageSquare className="h-3.5 w-3.5" />, label: "User Prompted", sub: "User chooses when" },
                ].map(({ key, icon, label, sub, recommended }) => (
                  <button
                    key={key}
                    onClick={() => setPatchMode(key)}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all"
                    style={{
                      borderColor: patchMode === key ? "#2d5016" : "#e2e4e7",
                      background: patchMode === key ? "#f0f7e8" : "white",
                      boxShadow: patchMode === key ? "0 0 0 1px #2d5016" : "none",
                    }}
                  >
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
              <button
                className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all active:scale-95"
                style={{ borderColor: "#e2e4e7", color: "#6b7280" }}
                onClick={() => setPatchTarget(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: "#2d5016", color: "white" }}
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
          background: "#2d5016",
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
