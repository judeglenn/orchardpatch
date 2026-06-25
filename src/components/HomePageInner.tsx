"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppCard } from "@/components/AppCard";
import { SearchBar } from "@/components/SearchBar";
import { apps as mockApps, stats as mockStats } from "@/lib/mockData";
import type { App, Device } from "@/lib/mockData";
import { checkAgent, fetchLocalInventory, normalizeAgentInventory } from "@/lib/agent";
import { setAgentData } from "@/lib/agentStore";
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
  name: "Name A-Z",
  lastSeen: "Recently Seen",
};

const CATEGORY_ALL = "All Categories";

const lastSynced = mockApps.reduce(
  (latest, app) => (app.lastSeen > latest ? app.lastSeen : latest),
  ""
);

export default function HomePageInner() {
  const searchParams = useSearchParams();

  const VALID_STATUS_PARAMS: Record<string, PatchStatus> = {
    outdated: "outdated",
    current:  "current",
    unknown:  "unknown",
    system:   "na",
    mas:      "mas",
  };
  const initialStatus = searchParams.get("status");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [conflictsOnly, setConflictsOnly] = useState(false); // kept for compat; drives patchStatusFilter
  const [patchStatusFilter, setPatchStatusFilter] = useState<PatchStatus | null>(
    initialStatus && VALID_STATUS_PARAMS[initialStatus] ? VALID_STATUS_PARAMS[initialStatus] : null
  );
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
  // patch status keyed by bundle_id (deduplicated - if any row is outdated, whole app is outdated)
  const [patchStatusMap, setPatchStatusMap] = useState<Record<string, { status: PatchStatus; latestVersion: string | null }>>({}); 
  const [statusSummary, setStatusSummary] = useState<{ outdated: number; current: number; unknown: number; na: number; mas: number } | null>(null);

  useEffect(() => {
    // Fetch patch status separately and build a bundle_id → status map
    async function loadPatchStatus() {
      try {
        const res = await fetch(`/api/apps/status`);
        if (!res.ok) return;
        const data = await res.json();
        const map: Record<string, { status: PatchStatus; latestVersion: string | null }> = {};
        let outdated = 0, current = 0, unknown = 0, na = 0, mas = 0;
        for (const row of data.apps as any[]) {
          const bid = (row.bundle_id || "").toLowerCase();
          if (!bid) continue;
          const existing = map[bid];
          // MAS apps get synthetic 'mas' status client-side for distinct filtering
          const rowStatus: PatchStatus = row.source === 'mas' ? 'mas' : row.patch_status;
          // Worst-case wins: outdated > unknown > current; na/mas is lowest priority
          if (!existing || rowStatus === "outdated" || (rowStatus === "unknown" && existing.status === "current") || (rowStatus !== "na" && rowStatus !== "mas" && (existing.status === "na" || existing.status === "mas"))) {
            map[bid] = { status: rowStatus, latestVersion: row.latest_version ?? null };
          }
        }
        // Tally unique bundle_ids
        for (const { status } of Object.values(map)) {
          if (status === "outdated") outdated++;
          else if (status === "current") current++;
          else if (status === "unknown") unknown++;
          else if (status === "na") na++;
          else if (status === "mas") mas++;
        }
        setPatchStatusMap(map);
        setStatusSummary({ outdated, current, unknown, na, mas });
      } catch { /* non-fatal */ }
    }
    loadPatchStatus();
  }, []);

  useEffect(() => {
    // Try fleet server first (multi-Mac) - fall back to local agent
    async function loadData() {
      try {
        const [statsRes, appsRes] = await Promise.all([
          fetch(`/api/stats`),
          fetch(`/api/apps/status`),
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

    // patchStatusFilter (from summary bar or Conflicts button) - uses real patch status data
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
    <div style={{ padding: "24px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Application Inventory
          </h1>
          <p style={{ fontSize: 14, marginTop: 2, color: "var(--text-secondary)" }}>
            Fleet-Wide Software Detection Across All Managed Devices
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search apps..."
            style={{ width: 240 }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" })
              )}
              style={{ background: "var(--surface-raised)", color: "var(--text-primary)", borderColor: "var(--border-hairline)", height: 36, gap: 6, fontSize: 14, padding: "0px 12px", whiteSpace: "nowrap" }}
            >
              {selectedCategory === CATEGORY_ALL ? "Category" : selectedCategory}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ maxHeight: 288, overflowY: "auto", zIndex: 50 }}>
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
                buttonVariants({ variant: "outline", size: "sm" })
              )}
              style={{ background: "var(--surface-raised)", color: "var(--text-primary)", borderColor: "var(--border-hairline)", height: 36, gap: 6, fontSize: 14, padding: "0px 12px", whiteSpace: "nowrap" }}
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
            style={
              (patchStatusFilter === "outdated" || conflictsOnly)
                ? { background: "var(--accent)", color: "var(--page-bg)", borderColor: "var(--accent)", padding: "0px 12px", gap: 6, whiteSpace: "nowrap", height: 36 }
                : { background: "var(--surface-raised)", color: "var(--text-primary)", borderColor: "var(--border-hairline)", padding: "0px 12px", gap: 6, whiteSpace: "nowrap", height: 36 }
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

      {/* Patch status summary bar - clickable pills filter the app list */}
      {statusSummary && (() => {
        type Pill = { status: PatchStatus; dot: string; label: string; count: number; activeColor: string; activeBg: string; activeBorder: string };
        const pills: Pill[] = [
          { status: "outdated", dot: "var(--st-outdated)", label: "outdated",  count: statusSummary.outdated, activeColor: "var(--st-lagging)", activeBg: "color-mix(in srgb, var(--st-lagging) 15%, transparent)", activeBorder: "color-mix(in srgb, var(--st-lagging) 50%, transparent)" },
          { status: "current",  dot: "var(--st-current)",  label: "current",   count: statusSummary.current,  activeColor: "var(--st-current)", activeBg: "var(--accent-tint)", activeBorder: "var(--border-accent)" },
          { status: "unknown",  dot: "var(--st-unknown)",  label: "Unknown",   count: statusSummary.unknown,  activeColor: "var(--text-secondary)", activeBg: "var(--surface-raised)", activeBorder: "var(--border-hairline)" },
          { status: "na",       dot: "var(--st-system)",   label: "System",    count: statusSummary.na,       activeColor: "var(--text-tertiary)", activeBg: "var(--surface-raised)", activeBorder: "var(--border-hairline)" },
          { status: "mas",      dot: "var(--st-store)",    label: "App Store", count: statusSummary.mas,       activeColor: "var(--accent)", activeBg: "var(--accent-tint)", activeBorder: "var(--border-accent)" },
        ];
        return (
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "8px 16px", marginBottom: 16, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)" }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 4, color: "var(--text-tertiary)" }}>Patch Status</span>
            {pills.map((pill, i) => {
              const active = patchStatusFilter === pill.status;
              return (
                <>
                  {i > 0 && <span key={`sep-${i}`} style={{ color: "var(--text-tertiary)" }}>·</span>}
                  <button
                    key={pill.status}
                    onClick={() => {
                      setPatchStatusFilter(active ? null : pill.status);
                      setConflictsOnly(false);
                    }}
                    style={active
                      ? { borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", background: pill.activeBg, color: pill.activeColor, border: `1px solid ${pill.activeBorder}` }
                      : { borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "transparent", color: "var(--text-secondary)", border: "1px solid transparent" }
                    }
                  >
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: pill.dot, marginRight: 5, flexShrink: 0 }} />
                    {pill.count} {pill.label}
                  </button>
                </>
              );
            })}
            {patchStatusFilter && (
              <button
                style={{ marginLeft: "auto", fontSize: 10, borderRadius: 4, padding: "2px 6px", cursor: "pointer", color: "var(--text-tertiary)", background: "var(--surface-raised)" }}
                onClick={() => { setPatchStatusFilter(null); setConflictsOnly(false); }}
              >
                clear
              </button>
            )}
          </div>
        );
      })()}

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard
          icon={<Package className="h-5 w-5" style={{ color: "var(--accent)" }} />}
          label="Total Apps"
          value={stats.totalApps.toLocaleString()}
          iconBg="var(--accent-tint)"
        />
        <StatCard
          icon={<Monitor className="h-5 w-5" style={{ color: "var(--st-current)" }} />}
          label="Total Devices"
          value={stats.totalDevices.toLocaleString()}
          iconBg="color-mix(in srgb, var(--st-current) 12%, transparent)"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" style={{ color: "var(--st-outdated)" }} />}
          label="Version Conflicts"
          value={stats.appsWithVersionConflicts.toLocaleString()}
          iconBg="color-mix(in srgb, var(--st-outdated) 12%, transparent)"
          onClick={() => setConflictsOnly((v) => !v)}
          active={conflictsOnly}
          activeColor="var(--st-outdated)"
        />
        <StatCard
          icon={<RefreshCw className="h-5 w-5" style={{ color: "var(--text-secondary)" }} />}
          label="Last Synced"
          value={formatRelativeDate(agentSyncTime ?? lastSynced)}
          iconBg="var(--surface-raised)"
          isText
        />
      </div>

      {/* Section label + result count + select all */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Select All checkbox */}
          <button
            style={{ display: "flex", alignItems: "center", gap: 8 }}
            onClick={toggleAll}
            aria-label="Select all apps"
          >
            <div
              style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${allFilteredSelected ? "var(--accent)" : someFilteredSelected ? "var(--accent)" : "var(--text-tertiary)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: allFilteredSelected ? "var(--accent)" : "var(--surface-raised)" }}
            >
              {allFilteredSelected && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {someFilteredSelected && !allFilteredSelected && (
                <div style={{ height: 2, width: 8, borderRadius: 9999, background: "var(--accent)" }} />
              )}
            </div>
          </button>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
            Applications
            {filtered.length !== apps.length && (
              <span style={{ marginLeft: 8, textTransform: "none", letterSpacing: "normal", fontWeight: 400 }}>
                - {filtered.length} of {apps.length}
              </span>
            )}
            {filtered.length === apps.length && (
              <span style={{ marginLeft: 8, textTransform: "none", letterSpacing: "normal", fontWeight: 400 }}>
                - {apps.length}
              </span>
            )}
          </span>
        </div>
        {(search || conflictsOnly || patchStatusFilter || selectedCategory !== CATEGORY_ALL) && (
          <Button
            variant="ghost"
            size="sm"
            style={{ color: "var(--text-secondary)", height: 24, fontSize: 12 }}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center", borderRadius: 16, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)" }}
        >
          <Package style={{ width: 48, height: 48, marginBottom: 16, color: "var(--text-tertiary)" }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            No apps found
          </p>
          <p style={{ fontSize: 14, marginTop: 4, color: "var(--text-secondary)" }}>
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Floating action bar */}
      <div
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 24, paddingTop: 16, pointerEvents: "none", transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)", opacity: selectedIds.size > 0 ? 1 : 0, transform: selectedIds.size > 0 ? "translateY(0)" : "translateY(120%)" }}
      >
        <div
          style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 16, borderRadius: 16, padding: "16px 24px", backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(24px) saturate(150%)", WebkitBackdropFilter: "blur(24px) saturate(150%)", border: "1px solid var(--border-accent)", boxShadow: "var(--shadow-card)" }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--st-current)" }}>
            {selectedIds.size} app{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div style={{ width: 1, height: 16, background: "var(--border-hairline)" }} />
          <button
            style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "var(--accent)", color: "var(--page-bg)" }}
            onClick={() => setShowModal(true)}
          >
            Patch by the Bushel 🧺
          </button>
          <button
            style={{ fontSize: 12, cursor: "pointer", color: "var(--text-secondary)" }}
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{ borderRadius: 16, width: "100%", maxWidth: 448, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
          >
            {/* Modal header */}
            <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border-hairline)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <div
                  style={{ display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, fontSize: 18, background: "var(--accent-tint)" }}
                >
                  🧺
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                  Patch by the Bushel
                </h2>
              </div>
              <p style={{ fontSize: 14, marginTop: 4, color: "var(--text-secondary)" }}>
                Review the apps queued for patching
              </p>
            </div>

            {/* App list */}
            <div style={{ padding: "16px 24px", maxHeight: 240, overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedApps.map((app) => (
                  <div key={app.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      {app.hasVersionConflict && (
                        <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0, color: "var(--st-outdated)" }} />
                      )}
                      <span style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>
                        {app.name}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, flexShrink: 0, marginLeft: 12, color: "var(--text-secondary)" }}>
                      {app.totalInstalls.toLocaleString()} device{app.totalInstalls !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div
              style={{ margin: "0 24px 16px", borderRadius: 12, padding: "12px 16px", background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}
            >
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>
                {selectedIds.size} app{selectedIds.size !== 1 ? "s" : ""} across {totalDevicesAffected.toLocaleString()} devices
              </p>
            </div>

            {/* Patch mode selector */}
            <div style={{ padding: "0 24px", marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, color: "var(--text-secondary)" }}>
                Patch Mode
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[
                  { key: "silent" as const, icon: <BellOff className="h-3.5 w-3.5" />, label: "Silent", sub: "Force quit, no prompts" },
                  { key: "managed" as const, icon: <Bell className="h-3.5 w-3.5" />, label: "Managed", sub: "Notify, must comply", recommended: true },
                  { key: "prompted" as const, icon: <MessageSquare className="h-3.5 w-3.5" />, label: "User Prompted", sub: "User chooses when" },
                ].map(({ key, icon, label, sub, recommended }) => (
                  <button
                    key={key}
                    onClick={() => setPatchMode(key)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, borderRadius: 12, padding: "10px 12px", textAlign: "left", cursor: "pointer", border: patchMode === key ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", background: patchMode === key ? "var(--accent-tint)" : "var(--surface-raised)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: patchMode === key ? "var(--accent)" : "var(--text-secondary)" }}>
                      {icon}
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
                      {recommended && <span style={{ fontSize: 9, padding: "2px 4px", borderRadius: 4, fontWeight: 500, background: "var(--accent-tint)", color: "var(--accent)" }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div
              style={{ margin: "0 24px 20px", display: "flex", alignItems: "flex-start", gap: 8, borderRadius: 12, padding: "12px 16px", background: "color-mix(in srgb, var(--st-outdated) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--st-outdated) 25%, transparent)" }}
            >
              <AlertTriangle style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, color: "var(--st-outdated)" }} />
              <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--st-outdated)" }}>
                This will deploy patches to all affected devices via Installomator. No MDM changes required.
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, padding: "0 24px 24px" }}>
              <button
                style={{ flex: 1, borderRadius: 12, padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ flex: 1, borderRadius: 12, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "var(--accent)", color: "var(--page-bg)" }}
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
        style={{ position: "fixed", top: 16, right: 16, zIndex: 60, display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 500, color: "var(--page-bg)", background: "var(--accent)",
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
      style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: 16, padding: 16, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: active ? `1px solid ${activeColor}60` : "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)", cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      <div
        style={{ display: "flex", width: 40, height: 40, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 8, background: iconBg }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          style={{ fontWeight: 700, lineHeight: 1.2, fontSize: isText ? 18 : 24, color: "var(--text-primary)" }}
        >
          {value}
        </p>
        <p style={{ fontSize: 12, fontWeight: 500, marginTop: 2, color: "var(--text-secondary)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}
