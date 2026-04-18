"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { AppCard } from "@/components/AppCard";
import { SearchBar } from "@/components/SearchBar";
import { apps as mockApps, stats as mockStats } from "@/lib/mockData";
import type { App, Device } from "@/lib/mockData";
import { checkAgent, fetchLocalInventory, normalizeAgentInventory } from "@/lib/agent";
import { setAgentData } from "@/lib/agentStore";
import { FLEET_SERVER_URL, FLEET_SERVER_TOKEN } from "@/lib/fleetServer";
import { type PatchStatus } from "@/components/PatchStatusBadge";
import {
  Package,
  Monitor,
  AlertTriangle,
  ChevronDown,
  Filter,
  RefreshCw,
  Sprout,
  BellOff,
  Bell,
  MessageSquare,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatRelativeDate } from "@/lib/utils";

type SortKey = "installs" | "name" | "lastSeen";

const SORT_LABELS: Record<SortKey, string> = {
  installs: "Most Installs",
  name: "Name A–Z",
  lastSeen: "Recently Seen",
};

const CATEGORY_ALL = "All Categories";

const lastSynced = mockApps.reduce(
  (latest, app) => (app.lastSeen > latest ? app.lastSeen : latest),
  ""
);

export default function HomePageInner() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [conflictsOnly, setConflictsOnly] = useState(false); // kept for compat; drives patchStatusFilter
  const [patchStatusFilter, setPatchStatusFilter] = useState<PatchStatus | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_ALL);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [patchMode, setPatchMode] = useState<"silent" | "managed" | "prompted">("managed");
  const [agentApps, setAgentApps] = useState<App[] | null>(null);
  const [agentStats, setAgentStats] = useState<typeof mockStats | null>(null);
  const [dataSource, setDataSource] = useState<"mock" | "agent">("mock");
  const [agentSyncTime, setAgentSyncTime] = useState<string | null>(null);
  // patch status keyed by bundle_id (deduplicated — if any row is outdated, whole app is outdated)
  const [patchStatusMap, setPatchStatusMap] = useState<Record<string, { status: PatchStatus; latestVersion: string | null }>>({});
  const [statusSummary, setStatusSummary] = useState<{ outdated: number; current: number; unknown: number; na: number } | null>(null);

  useEffect(() => {
    // Fetch patch status separately and build a bundle_id → status map
    async function loadPatchStatus() {
      try {
        const res = await fetch(`${FLEET_SERVER_URL}/apps/status`, {
          headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
        });
        if (!res.ok) return;
        const data = await res.json();
        const map: Record<string, { status: PatchStatus; latestVersion: string | null }> = {};
        let outdated = 0, current = 0, unknown = 0, na = 0;
        for (const row of data.apps as any[]) {
          const bid = (row.bundle_id || "").toLowerCase();
          if (!bid) continue;
          const existing = map[bid];
          const rowStatus: PatchStatus = row.patch_status;
          // Worst-case wins: outdated > unknown > current; na is lowest priority
          if (!existing || rowStatus === "outdated" || (rowStatus === "unknown" && existing.status === "current") || (rowStatus !== "na" && existing.status === "na")) {
            map[bid] = { status: rowStatus, latestVersion: row.latest_version ?? null };
          }
        }
        // Tally unique bundle_ids
        for (const { status } of Object.values(map)) {
          if (status === "outdated") outdated++;
          else if (status === "current") current++;
          else if (status === "unknown") unknown++;
          else if (status === "na") na++;
        }
        setPatchStatusMap(map);
        setStatusSummary({ outdated, current, unknown, na });
      } catch { /* non-fatal */ }
    }
    loadPatchStatus();
  }, []);

  useEffect(() => {
    // Try fleet server first (multi-Mac) — fall back to local agent
    async function loadData() {
      try {
        const [statsRes, appsRes] = await Promise.all([
          fetch(`${FLEET_SERVER_URL}/stats`, { headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN } }),
          fetch(`${FLEET_SERVER_URL}/apps/status`, { headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN } }),
        ]);
        if (statsRes.ok && appsRes.ok) {
          const statsData = await statsRes.json();
          const appsData = await appsRes.json();

          // Normalize fleet apps into the App format, deduplicating by bundle_id
          // then by canonical name (case-insensitive) to merge apps from different
          // install paths (e.g. /Applications vs ~/Applications).
          const bundleToKey: Record<string, string> = {};
          const nameToKey: Record<string, string> = {};
          const fleetApps = Object.values(
            (appsData.apps as any[]).reduce((acc: Record<string, any>, a: any) => {
              const bundleLower = (a.bundle_id || "").toLowerCase().trim();
              const nameLower = (a.name || "").toLowerCase().trim();

              // Find existing entry by bundle_id first (if not empty), then canonical name
              const existingKey =
                (bundleLower && bundleToKey[bundleLower]) ||
                (nameLower && nameToKey[nameLower]) ||
                null;

              if (!existingKey) {
                const id = a.bundle_id
                  ? a.bundle_id.replace(/\./g, "-")
                  : nameLower.replace(/\s+/g, "-") || `app-${Object.keys(acc).length}`;
                acc[id] = {
                  id,
                  name: a.name,
                  bundleId: a.bundle_id,
                  category: "Utilities",
                  versions: [{ version: a.version || "unknown", deviceCount: 1 }],
                  totalInstalls: 1,
                  mostCommonVersion: a.version || "unknown",
                  hasVersionConflict: a.patch_status === "outdated",
                  lastSeen: a.last_seen,
                  latestVersion: a.latest_version,
                };
                if (bundleLower) bundleToKey[bundleLower] = id;
                if (nameLower) nameToKey[nameLower] = id;
              } else {
                acc[existingKey].totalInstalls++;
                const existing = acc[existingKey].versions.find((v: any) => v.version === a.version);
                if (existing) existing.deviceCount++;
                else acc[existingKey].versions.push({ version: a.version || "unknown", deviceCount: 1 });
                if (a.patch_status === "outdated") acc[existingKey].hasVersionConflict = true;
                // Keep the most recent lastSeen
                if (a.last_seen && a.last_seen > acc[existingKey].lastSeen) {
                  acc[existingKey].lastSeen = a.last_seen;
                }
              }
              return acc;
            }, {})
          ) as App[];

          setAgentApps(fleetApps);
          setAgentStats({
            totalApps: statsData.totalApps,
            totalDevices: statsData.totalDevices,
            appsWithVersionConflicts: statsData.outdatedApps,
          });
          setDataSource("agent");
          setAgentSyncTime(statsData.lastCheckin);
          return;
        }
      } catch { /* fall through to local agent */ }

      // Fall back to local agent
      console.log("[OrchardPatch] Fleet server unavailable, checking local agent...");
      const { connected } = await checkAgent();
      if (!connected) return;
      try {
        const raw = await fetchLocalInventory();
        const normalized = normalizeAgentInventory(raw);
        setAgentApps(normalized.apps as App[]);
        setAgentStats(normalized.stats);
        setDataSource("agent");
        setAgentSyncTime(new Date().toISOString());
        setAgentData(
          normalized.apps as App[],
          normalized.devices as Device[],
          new Date().toISOString()
        );
      } catch (err) {
        console.error("[OrchardPatch] Error loading agent data:", err);
      }
    }
    loadData();
  }, []);

  const apps = agentApps ?? mockApps;
  const stats = agentStats ?? mockStats;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const toggleApp = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(apps.map((a) => a.category))).sort();
    return [CATEGORY_ALL, ...cats];
  }, []);

  const filtered = useMemo(() => {
    let result = apps;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.bundleId.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }

    // patchStatusFilter (from summary bar or Conflicts button) — uses real patch status data
    const activeStatusFilter = patchStatusFilter ?? (conflictsOnly ? "outdated" : null);
    if (activeStatusFilter) {
      result = result.filter((a) => {
        const bid = (a.bundleId || "").toLowerCase();
        const status = patchStatusMap[bid]?.status ?? "unknown";
        return status === activeStatusFilter;
      });
    }

    if (selectedCategory !== CATEGORY_ALL) {
      result = result.filter((a) => a.category === selectedCategory);
    }

    switch (sortBy) {
      case "installs":
        result = [...result].sort((a, b) => b.totalInstalls - a.totalInstalls);
        break;
      case "name":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "lastSeen":
        result = [...result].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
        break;
    }

    return result;
  }, [search, sortBy, conflictsOnly, patchStatusFilter, patchStatusMap, selectedCategory, apps]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));
  const someFilteredSelected =
    !allFilteredSelected && filtered.some((a) => selectedIds.has(a.id));

  const toggleAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.add(a.id));
        return next;
      });
    }
  }, [allFilteredSelected, filtered]);

  const patchAllOutdated = useCallback(() => {
    const outdated = apps.filter((a) => a.hasVersionConflict);
    setSelectedIds(new Set(outdated.map((a) => a.id)));
    setShowModal(true);
  }, [apps]);

  const selectedApps = useMemo(
    () => apps.filter((a) => selectedIds.has(a.id)),
    [selectedIds]
  );

  const totalDevicesAffected = useMemo(
    () => selectedApps.reduce((sum, a) => sum + a.totalInstalls, 0),
    [selectedApps]
  );

  const handleConfirmPatch = useCallback(() => {
    const count = selectedIds.size;
    setShowModal(false);
    setSelectedIds(new Set());
    showToast(`Patching queued for ${count} app${count !== 1 ? "s" : ""} (coming soon)`);
  }, [selectedIds.size, showToast]);

  return (
    <div className="px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#f0f8ec" }}>
            App Inventory
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            Software inventory across your entire device fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-sm font-semibold"
            style={{ background: "rgba(125,217,74,0.12)", color: "#9fe066", borderColor: "rgba(125,217,74,0.35)" }}
            onClick={patchAllOutdated}
          >
            <Sprout className="h-3.5 w-3.5" />
            Patch All Outdated
          </Button>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search apps…"
            className="w-60"
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 text-sm"
              )}
              style={{ background: "rgba(255,255,255,0.06)", color: "#f0f8ec", borderColor: "rgba(255,255,255,0.12)" }}
            >
              {selectedCategory === CATEGORY_ALL ? "Category" : selectedCategory}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? "font-semibold" : ""}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 text-sm"
              )}
              style={{ background: "rgba(255,255,255,0.06)", color: "#f0f8ec", borderColor: "rgba(255,255,255,0.12)" }}
            >
              {SORT_LABELS[sortBy]}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={sortBy === key ? "font-semibold" : ""}
                >
                  {SORT_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant={(patchStatusFilter === "outdated" || conflictsOnly) ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1.5 text-sm"
            style={
              (patchStatusFilter === "outdated" || conflictsOnly)
                ? { background: "#5aaa28", color: "white", borderColor: "#5aaa28" }
                : { background: "rgba(255,255,255,0.06)", color: "#f0f8ec", borderColor: "rgba(255,255,255,0.12)" }
            }
            onClick={() => {
              const isActive = patchStatusFilter === "outdated" || conflictsOnly;
              setPatchStatusFilter(isActive ? null : "outdated");
              setConflictsOnly(false);
            }}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Outdated</span>
          </Button>
        </div>
      </div>

      {/* Patch status summary bar — clickable pills filter the app list */}
      {statusSummary && (() => {
        type Pill = { status: PatchStatus; emoji: string; label: string; count: number; activeColor: string; activeBg: string; activeBorder: string };
        const pills: Pill[] = [
          { status: "outdated", emoji: "🔴", label: "outdated", count: statusSummary.outdated, activeColor: "#ef5350", activeBg: "rgba(239,83,80,0.15)", activeBorder: "rgba(239,83,80,0.5)" },
          { status: "current",  emoji: "✅", label: "current",  count: statusSummary.current,  activeColor: "#9fe066", activeBg: "rgba(125,217,74,0.15)", activeBorder: "rgba(125,217,74,0.5)" },
          { status: "unknown",  emoji: "🟡", label: "Unknown",  count: statusSummary.unknown,  activeColor: "rgba(255,255,255,0.7)", activeBg: "rgba(255,255,255,0.08)", activeBorder: "rgba(255,255,255,0.25)" },
          { status: "na",       emoji: "⚙️",  label: "System",   count: statusSummary.na,       activeColor: "rgba(255,255,255,0.4)", activeBg: "rgba(255,255,255,0.06)", activeBorder: "rgba(255,255,255,0.15)" },
        ];
        return (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2 mb-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] mr-1" style={{ color: "rgba(255,255,255,0.3)" }}>Patch Status</span>
            {pills.map((pill, i) => {
              const active = patchStatusFilter === pill.status;
              return (
                <>
                  {i > 0 && <span key={`sep-${i}`} style={{ color: "rgba(255,255,255,0.15)" }}>·</span>}
                  <button
                    key={pill.status}
                    onClick={() => {
                      setPatchStatusFilter(active ? null : pill.status);
                      setConflictsOnly(false);
                    }}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all"
                    style={active
                      ? { background: pill.activeBg, color: pill.activeColor, border: `1px solid ${pill.activeBorder}` }
                      : { background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid transparent" }
                    }
                  >
                    {pill.emoji} {pill.count} {pill.label}
                  </button>
                </>
              );
            })}
            {patchStatusFilter && (
              <button
                className="ml-auto text-[10px] rounded px-1.5 py-0.5 transition-colors"
                style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)" }}
                onClick={() => { setPatchStatusFilter(null); setConflictsOnly(false); }}
              >
                clear
              </button>
            )}
          </div>
        );
      })()}

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Package className="h-5 w-5" style={{ color: "#7dd94a" }} />}
          label="Total Apps"
          value={stats.totalApps.toLocaleString()}
          iconBg="rgba(125,217,74,0.12)"
        />
        <StatCard
          icon={<Monitor className="h-5 w-5" style={{ color: "#4caf50" }} />}
          label="Total Devices"
          value={stats.totalDevices.toLocaleString()}
          iconBg="rgba(76,175,80,0.12)"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" style={{ color: "#ffb74d" }} />}
          label="Version Conflicts"
          value={stats.appsWithVersionConflicts.toLocaleString()}
          iconBg="rgba(255,160,0,0.12)"
          onClick={() => setConflictsOnly((v) => !v)}
          active={conflictsOnly}
          activeColor="#ffb74d"
        />
        <StatCard
          icon={<RefreshCw className="h-5 w-5" style={{ color: "rgba(255,255,255,0.55)" }} />}
          label="Last Synced"
          value={formatRelativeDate(agentSyncTime ?? lastSynced)}
          iconBg="rgba(255,255,255,0.06)"
          isText
        />
      </div>

      {/* Section label + result count + select all */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Select All checkbox */}
          <button
            className="flex items-center gap-2 group"
            onClick={toggleAll}
            aria-label="Select all apps"
          >
            <div
              className="h-4 w-4 rounded border-2 flex items-center justify-center transition-all duration-150 flex-shrink-0"
              style={{
                borderColor: allFilteredSelected ? "#7dd94a" : someFilteredSelected ? "#7dd94a" : "rgba(255,255,255,0.3)",
                background: allFilteredSelected ? "#5aaa28" : "rgba(255,255,255,0.05)",
              }}
            >
              {allFilteredSelected && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {someFilteredSelected && !allFilteredSelected && (
                <div className="h-0.5 w-2 rounded-full" style={{ background: "#7dd94a" }} />
              )}
            </div>
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Applications
            {filtered.length !== apps.length && (
              <span className="ml-2 normal-case tracking-normal font-normal">
                — {filtered.length} of {apps.length}
              </span>
            )}
            {filtered.length === apps.length && (
              <span className="ml-2 normal-case tracking-normal font-normal">
                — {apps.length}
              </span>
            )}
          </span>
        </div>
        {(search || conflictsOnly || patchStatusFilter || selectedCategory !== CATEGORY_ALL) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            style={{ color: "rgba(255,255,255,0.55)" }}
            onClick={() => {
              setSearch("");
              setConflictsOnly(false);
              setPatchStatusFilter(null);
              setSelectedCategory(CATEGORY_ALL);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* App list */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filtered.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              totalDevices={stats.totalDevices}
              selected={selectedIds.has(app.id)}
              onToggle={toggleApp}
              patchStatus={patchStatusMap[app.bundleId?.toLowerCase()]?.status}
              latestVersion={patchStatusMap[app.bundleId?.toLowerCase()]?.latestVersion}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Package className="h-12 w-12 mb-4" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-base font-semibold" style={{ color: "#f0f8ec" }}>
            No apps found
          </p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Floating action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center pb-6 pt-4 pointer-events-none"
        style={{
          transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          opacity: selectedIds.size > 0 ? 1 : 0,
          transform: selectedIds.size > 0 ? "translateY(0)" : "translateY(120%)",
        }}
      >
        <div
          className="pointer-events-auto flex items-center gap-4 rounded-2xl px-6 py-4"
          style={{
            background: "rgba(5,15,3,0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(125,217,74,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
            color: "white",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "#9fe066" }}>
            {selectedIds.size} app{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="h-4 w-px" style={{ background: "rgba(255,255,255,0.15)" }} />
          <button
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-95"
            style={{ background: "#5aaa28", color: "white" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#6abf32")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#5aaa28")}
            onClick={() => setShowModal(true)}
          >
            Patch by the Bushel 🧺
          </button>
          <button
            className="text-xs transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.55)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#9fe066")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="rounded-2xl shadow-2xl w-full max-w-md"
            style={{
              background: "rgba(12,22,8,0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                  style={{ background: "rgba(125,217,74,0.15)" }}
                >
                  🧺
                </div>
                <h2 className="text-lg font-bold" style={{ color: "#f0f8ec" }}>
                  Patch by the Bushel
                </h2>
              </div>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                Review the apps queued for patching
              </p>
            </div>

            {/* App list */}
            <div className="px-6 py-4 max-h-60 overflow-y-auto">
              <div className="flex flex-col gap-2">
                {selectedApps.map((app) => (
                  <div key={app.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {app.hasVersionConflict && (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "#ffb74d" }} />
                      )}
                      <span className="text-sm font-medium truncate" style={{ color: "#f0f8ec" }}>
                        {app.name}
                      </span>
                    </div>
                    <span className="text-xs shrink-0 ml-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {app.totalInstalls.toLocaleString()} device{app.totalInstalls !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div
              className="mx-6 mb-4 rounded-xl px-4 py-3"
              style={{ background: "rgba(125,217,74,0.1)", border: "1px solid rgba(125,217,74,0.2)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#9fe066" }}>
                {selectedIds.size} app{selectedIds.size !== 1 ? "s" : ""} across {totalDevicesAffected.toLocaleString()} devices
              </p>
            </div>

            {/* Patch mode selector */}
            <div className="px-6 mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                Patch Mode
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "silent" as const, icon: <BellOff className="h-3.5 w-3.5" />, label: "Silent", sub: "Force quit, no prompts" },
                  { key: "managed" as const, icon: <Bell className="h-3.5 w-3.5" />, label: "Managed", sub: "Notify, must comply", recommended: true },
                  { key: "prompted" as const, icon: <MessageSquare className="h-3.5 w-3.5" />, label: "User Prompted", sub: "User chooses when" },
                ].map(({ key, icon, label, sub, recommended }) => (
                  <button
                    key={key}
                    onClick={() => setPatchMode(key)}
                    className="flex flex-col items-start gap-1 rounded-xl px-3 py-2.5 text-left transition-all duration-150"
                    style={{
                      border: patchMode === key ? "1px solid rgba(125,217,74,0.5)" : "1px solid rgba(255,255,255,0.12)",
                      background: patchMode === key ? "rgba(125,217,74,0.12)" : "rgba(255,255,255,0.04)",
                      boxShadow: patchMode === key ? "0 0 0 1px rgba(125,217,74,0.3)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-1.5" style={{ color: patchMode === key ? "#7dd94a" : "rgba(255,255,255,0.55)" }}>
                      {icon}
                      <span className="text-xs font-semibold">{label}</span>
                      {recommended && <span className="text-[9px] px-1 py-0.5 rounded font-medium" style={{ background: "rgba(125,217,74,0.2)", color: "#9fe066" }}>✓</span>}
                    </div>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div
              className="mx-6 mb-5 flex items-start gap-2 rounded-xl px-4 py-3"
              style={{ background: "rgba(255,160,0,0.08)", border: "1px solid rgba(255,160,0,0.25)" }}
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#ffb74d" }} />
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,183,77,0.9)" }}>
                This will deploy patches to all affected devices via Installomator. No MDM changes required.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 active:scale-95"
                style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.04)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95"
                style={{ background: "#5aaa28", color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#6abf32")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#5aaa28")}
                onClick={handleConfirmPatch}
              >
                Start Patching 🌳
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      <div
        className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
        style={{
          background: "#5aaa28",
          boxShadow: "0 8px 24px rgba(90,170,40,0.4)",
          transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          opacity: toastMsg ? 1 : 0,
          transform: toastMsg ? "translateY(0)" : "translateY(-120%)",
          pointerEvents: toastMsg ? "auto" : "none",
        }}
      >
        <span>🌳</span>
        {toastMsg}
      </div>
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  isText?: boolean;
}

function StatCard({ icon, label, value, iconBg, onClick, active, activeColor, isText }: StatCardProps) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl px-4 py-4 transition-all"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: active ? `1px solid ${activeColor}60` : "1px solid rgba(255,255,255,0.12)",
        boxShadow: active
          ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${activeColor}30, inset 0 1px 0 rgba(255,255,255,0.08)`
          : "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={`font-bold leading-tight ${isText ? "text-lg" : "text-2xl"}`}
          style={{ color: "#f0f8ec" }}
        >
          {value}
        </p>
        <p className="text-xs font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}
