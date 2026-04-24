"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FLEET_SERVER_URL, FLEET_SERVER_TOKEN } from "@/lib/fleetServer";
import {
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  WifiOff,
  Clock,
} from "lucide-react";
import { appInitials, appColorClass, formatRelativeDate } from "@/lib/utils";

type PatchMode = "silent" | "managed" | "prompted";
type PatchMethod = "fruit" | "branch" | "bushel" | "orchard";
type PatchStatus = "success" | "failed" | "running" | "queued";

type PatchJob = {
  jobId: string;
  appName: string;
  bundleId?: string;
  label?: string;
  mode: PatchMode;
  method?: PatchMethod;
  initiatedBy?: string | null;
  status: PatchStatus;
  deviceId: string;
  deviceName: string;
  startedAt: string;
  completedAt?: string;
  log?: string | string[];
  error?: string;
};

const MOCK_JOBS: PatchJob[] = [
  {
    jobId: "job-001",
    appName: "Google Chrome",
    bundleId: "com.google.Chrome",
    mode: "managed",
    status: "success",
    deviceId: "dev-001",
    deviceName: "chip-mbp.local",
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 48000).toISOString(),
    log: "🌳 Starting patch for Google Chrome (googlechromepkg)\nChecking installed version: 122.0.6261.128\nLatest available: 124.0.6367.82\nDownloading googlechromepkg...\nInstalling Google Chrome...\n✅ Successfully patched Google Chrome to 124.0.6367.82",
  },
  {
    jobId: "job-002",
    appName: "Slack",
    bundleId: "com.tinyspeck.slackmacgap",
    mode: "silent",
    status: "failed",
    deviceId: "dev-002",
    deviceName: "eng-mac-17.local",
    startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000 + 12000).toISOString(),
    log: "🌳 Starting patch for Slack (slack)\nChecking installed version: 4.36.140\nDownloading slack...\n❌ Error: Download failed — checksum mismatch",
    error: "Download failed — checksum mismatch",
  },
  {
    jobId: "job-003",
    appName: "Zoom",
    bundleId: "us.zoom.xos",
    mode: "prompted",
    status: "success",
    deviceId: "dev-003",
    deviceName: "design-mac-02.local",
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 62000).toISOString(),
    log: "🌳 Starting patch for Zoom (zoom)\nPrompting user to quit Zoom...\nUser accepted update dialog\nInstalling zoom...\n✅ Successfully patched Zoom to 5.17.11",
  },
  {
    jobId: "job-004",
    appName: "Visual Studio Code",
    bundleId: "com.microsoft.VSCode",
    mode: "managed",
    status: "running",
    deviceId: "dev-001",
    deviceName: "chip-mbp.local",
    startedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    log: "🌳 Starting patch for Visual Studio Code (visualstudiocode)\nDownloading visualstudiocode...\nInstalling...",
  },
  {
    jobId: "job-005",
    appName: "Firefox",
    bundleId: "org.mozilla.firefox",
    mode: "silent",
    status: "queued",
    deviceId: "dev-004",
    deviceName: "finance-mac-05.local",
    startedAt: new Date(Date.now() - 30 * 1000).toISOString(),
    log: "",
  },
];

const glassPanel: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
};

function formatDuration(startedAt: string, completedAt?: string): string {
  if (!completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function MethodBadge({ method }: { method?: string | null }) {
  const cfg: Record<string, { label: string; emoji: string; bg: string; color: string; border: string }> = {
    fruit:   { label: "Fruit",   emoji: "🍎", bg: "rgba(125,217,74,0.1)",  color: "#9fe066", border: "rgba(125,217,74,0.3)" },
    branch:  { label: "Branch",  emoji: "🌿", bg: "rgba(100,200,100,0.1)", color: "#7dd94a", border: "rgba(100,200,100,0.3)" },
    bushel:  { label: "Bushel",  emoji: "🧺", bg: "rgba(255,183,77,0.1)",  color: "#ffb74d", border: "rgba(255,183,77,0.3)" },
    orchard: { label: "Orchard", emoji: "🌳", bg: "rgba(100,181,246,0.1)", color: "#90caf9", border: "rgba(100,181,246,0.3)" },
  };
  const m = method && cfg[method] ? cfg[method] : null;
  if (!m) return <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}
    >
      {m.emoji} {m.label}
    </span>
  );
}

function ModeBadge({ mode }: { mode?: string | null }) {
  if (mode === "silent") return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}>
      Silent
    </span>
  );
  if (mode === "managed") return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(125,217,74,0.12)", color: "#9fe066", border: "1px solid rgba(125,217,74,0.3)" }}>
      Managed
    </span>
  );
  if (mode === "prompted") return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(100,181,246,0.12)", color: "#90caf9", border: "1px solid rgba(100,181,246,0.3)" }}>
      User Prompted
    </span>
  );
  return <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>;
}

function StatusBadge({ status }: { status: PatchStatus }) {
  if (status === "success") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(125,217,74,0.12)",
          color: "#9fe066",
          border: "1px solid rgba(125,217,74,0.3)",
        }}
      >
        <CheckCircle2 className="h-3 w-3" /> Success
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(244,67,54,0.12)",
          color: "#ef9a9a",
          border: "1px solid rgba(244,67,54,0.3)",
        }}
      >
        <XCircle className="h-3 w-3" /> Failed
      </span>
    );
  }
  if (status === "running") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(255,183,77,0.12)",
          color: "#ffb74d",
          border: "1px solid rgba(255,183,77,0.3)",
        }}
      >
        <Loader2 className="h-3 w-3 animate-spin" /> Running
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.45)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <Clock className="h-3 w-3" /> Queued
    </span>
  );
}

function JobRows({ job, index }: { job: PatchJob; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const initials = appInitials(job.appName);
  const colorClass = appColorClass(job.appName);

  return (
    <>
      <tr
        className="border-b transition-colors"
        style={{
          background: index % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
          borderColor: "rgba(255,255,255,0.06)",
          cursor: job.log ? "pointer" : "default",
        }}
        onClick={() => job.log && setExpanded((e) => !e)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold ${colorClass}`}
            >
              {initials}
            </div>
            <span className="text-sm font-medium" style={{ color: "#f0f8ec" }}>
              {job.appName}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <MethodBadge method={job.method} />
        </td>
        <td className="px-4 py-3">
          <ModeBadge mode={job.mode} />
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={job.status} />
        </td>
        <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          {job.deviceName}
        </td>
        <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          {job.initiatedBy ?? <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
        </td>
        <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          {formatRelativeDate(job.startedAt)}
        </td>
        <td className="px-4 py-3 text-sm font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>
          {formatDuration(job.startedAt, job.completedAt)}
        </td>
        <td className="px-4 py-3 text-right">
          {job.log ? (
            <span style={{ color: "rgba(255,255,255,0.35)" }}>
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          ) : null}
        </td>
      </tr>
      {expanded && job.log && (() => {
        const logStr = Array.isArray(job.log) ? (job.log as string[]).join("\n") : (job.log as string);
        const lines = logStr.split("\n");
        return (
          <tr style={{ background: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <td colSpan={9} className="px-4 pb-3 pt-0">
              <div
                className="text-[11px] font-mono leading-relaxed rounded-lg px-4 py-3 mt-1"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  maxHeight: "320px",
                  overflowY: "auto",
                }}
              >
                {lines.map((line, i) => {
                  const u = line.toUpperCase();
                  let color = "rgba(255,255,255,0.7)";
                  if (/ERROR|FAILED|EXIT CODE [^0]|EXITED WITH/.test(u)) color = "#ef9a9a";
                  else if (/WARNING|WARN/.test(u)) color = "#ffb74d";
                  else if (/SUCCESS|SUCCESSFULLY/.test(u)) color = "#9fe066";
                  return (
                    <div key={i} style={{ color, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {line || "\u00a0"}
                    </div>
                  );
                })}
              </div>
            </td>
          </tr>
        );
      })()}
    </>
  );
}

// ─── Date range helpers ──────────────────────────────────────────────────────

function isWithinDateRange(dateStr: string | undefined, range: string): boolean {
  if (!dateStr || range === "all") return true;
  const date = new Date(dateStr);
  const now = Date.now();
  if (range === "24h") return now - date.getTime() < 24 * 60 * 60 * 1000;
  if (range === "7d") return now - date.getTime() < 7 * 24 * 60 * 60 * 1000;
  if (range === "30d") return now - date.getTime() < 30 * 24 * 60 * 60 * 1000;
  return true;
}

// ─── Inner page (needs useSearchParams) ──────────────────────────────────────

function PatchesPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobs, setJobs] = useState<PatchJob[]>([]);
  const [devices, setDevices] = useState<{ id: string; hostname: string }[]>([]);
  const [deviceQuery, setDeviceQuery] = useState("");
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const deviceInputRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [agentOffline, setAgentOffline] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ─── Filter state (URL-driven) ──────────────────────────────────────────────
  const filterDevice = searchParams.get("device_id") ?? "";
  // Keep typeahead input in sync with URL param (e.g. redirect from Branch modal)
  const filterDeviceHostname = useMemo(
    () => devices.find((d) => d.id === filterDevice)?.hostname ?? "",
    [devices, filterDevice]
  );
  const filterStatus = searchParams.get("status") ?? "";
  const filterMethod = searchParams.get("method") ?? "";
  const filterMode = searchParams.get("mode") ?? "";
  const filterDate = searchParams.get("date") ?? "all";
  const filterApp = searchParams.get("app") ?? "";

  // Click-outside to close device dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (deviceInputRef.current && !deviceInputRef.current.contains(e.target as Node)) {
        setDeviceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Sync typeahead display with URL param
  useEffect(() => {
    if (!deviceDropdownOpen) {
      setDeviceQuery(filterDeviceHostname);
    }
  }, [filterDeviceHostname, deviceDropdownOpen]);

  const filteredDevices = useMemo(() => {
    if (!deviceQuery) return devices;
    return devices.filter((d) => d.hostname.toLowerCase().includes(deviceQuery.toLowerCase()));
  }, [devices, deviceQuery]);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/patches?${params.toString()}`);
  }

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const [fleetRes, devicesRes] = await Promise.all([
        fetch(`${FLEET_SERVER_URL}/patch-jobs?limit=500`, {
          headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
        }).catch(() => null),
        fetch(`${FLEET_SERVER_URL}/devices`, {
          headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
        }).catch(() => null),
      ]);

      if (fleetRes?.ok) {
        const data = await fleetRes.json();
        const normalized = (data.jobs || []).map((j: any) => ({
          id: j.id,
          jobId: j.id,
          appName: j.app_name,
          label: j.label,
          mode: j.mode,
          method: j.method ?? "fruit",
          initiatedBy: j.initiated_by ?? null,
          status: j.status,
          deviceId: j.device_id,
          deviceName: j.device_name || j.device_id,
          createdAt: j.created_at,
          startedAt: j.started_at || j.created_at,
          completedAt: j.completed_at,
          exitCode: j.exit_code,
          error: j.error,
          log: j.log ? j.log.split("\n") : [],
        }));
        setJobs(normalized);
        setAgentOffline(false);
      } else {
        setAgentOffline(true);
        setJobs(MOCK_JOBS);
      }

      if (devicesRes?.ok) {
        const data = await devicesRes.json();
        setDevices((data.devices || []).map((d: any) => ({ id: d.id, hostname: d.hostname })));
      }
    } catch {
      setAgentOffline(true);
      setJobs(MOCK_JOBS);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ─── Filtered jobs ──────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (filterDevice && j.deviceId !== filterDevice) return false;
      if (filterStatus && j.status !== filterStatus) return false;
      if (filterMethod && j.method !== filterMethod) return false;
      if (filterMode && j.mode !== filterMode) return false;
      if (filterDate !== "all" && !isWithinDateRange(j.startedAt, filterDate)) return false;
      if (filterApp && !j.appName?.toLowerCase().includes(filterApp.toLowerCase()) &&
          !j.label?.toLowerCase().includes(filterApp.toLowerCase())) return false;
      return true;
    });
  }, [jobs, filterDevice, filterStatus, filterMethod, filterMode, filterDate, filterApp]);

  const hasFilters = filterDevice || filterStatus || filterMethod || filterMode || (filterDate && filterDate !== "all") || filterApp;

  const total = filteredJobs.length;
  const succeeded = filteredJobs.filter((j) => j.status === "success").length;
  const failed = filteredJobs.filter((j) => j.status === "failed").length;
  const running = filteredJobs.filter((j) => j.status === "running").length;
  const successRate =
    succeeded + failed > 0 ? Math.round((succeeded / (succeeded + failed)) * 100) : 0;
  const lastJob =
    filteredJobs.length > 0
      ? filteredJobs.reduce((a, b) => (new Date(a.startedAt) > new Date(b.startedAt) ? a : b))
      : null;

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "rgba(125,217,74,0.12)",
              border: "1px solid rgba(125,217,74,0.25)",
            }}
          >
            <ClipboardList className="h-5 w-5" style={{ color: "#7dd94a" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#f0f8ec" }}>
              Patch History
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {lastRefresh
                ? `Last updated ${formatRelativeDate(lastRefresh.toISOString())}`
                : "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Offline banner */}
      {agentOffline && (
        <div
          className="mb-5 flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: "rgba(255,183,77,0.08)",
            border: "1px solid rgba(255,183,77,0.25)",
          }}
        >
          <WifiOff className="h-4 w-4 shrink-0" style={{ color: "#ffb74d" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#ffb74d" }}>
              Agent offline — showing sample data
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,183,77,0.7)" }}>
              Start the OrchardPatch agent to see real patch history.
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Jobs", value: String(total), color: "#f0f8ec" },
          {
            label: "Success Rate",
            value: succeeded + failed > 0 ? `${successRate}%` : "—",
            color:
              successRate >= 90 ? "#9fe066" : successRate >= 70 ? "#ffb74d" : "#ef9a9a",
          },
          {
            label: "Running",
            value: String(running),
            color: running > 0 ? "#ffb74d" : "rgba(255,255,255,0.45)",
          },
          {
            label: "Last Patch",
            value: lastJob ? formatRelativeDate(lastJob.startedAt) : "—",
            color: "rgba(255,255,255,0.7)",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl px-5 py-4" style={glassPanel}>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {stat.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl px-5 py-4 mb-4 flex flex-wrap gap-3 items-end" style={{ ...glassPanel, overflow: "visible", position: "relative", zIndex: 20 }}>
        {/* Device typeahead */}
        <div className="flex flex-col gap-1 relative" ref={deviceInputRef}>
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.4)" }}>Device</label>
          <input
            type="text"
            value={deviceDropdownOpen ? deviceQuery : (filterDeviceHostname || deviceQuery)}
            placeholder="Search devices…"
            onFocus={() => { setDeviceQuery(""); setDeviceDropdownOpen(true); }}
            onChange={(e) => { setDeviceQuery(e.target.value); setDeviceDropdownOpen(true); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setDeviceDropdownOpen(false); setDeviceQuery(filterDeviceHostname); }
              if (e.key === "Backspace" && !deviceQuery && filterDevice) {
                setFilter("device_id", "");
                setDeviceQuery("");
              }
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium w-44"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: filterDevice ? "1px solid rgba(125,217,74,0.4)" : "1px solid rgba(255,255,255,0.12)",
              color: "#f0f8ec",
              outline: "none",
            }}
          />
          {deviceDropdownOpen && (
            <div
              className="absolute top-full mt-1 left-0 w-52 rounded-xl"
              style={{
                background: "rgba(18,32,12,0.98)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 9999,
              }}
            >
              <button
                className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/5"
                style={{ color: !filterDevice ? "#9fe066" : "rgba(255,255,255,0.45)" }}
                onMouseDown={() => { setFilter("device_id", ""); setDeviceQuery(""); setDeviceDropdownOpen(false); }}
              >
                All Devices
              </button>
              {filteredDevices.map((d) => (
                <button
                  key={d.id}
                  className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/5"
                  style={{ color: filterDevice === d.id ? "#9fe066" : "#f0f8ec" }}
                  onMouseDown={() => { setFilter("device_id", d.id); setDeviceQuery(d.hostname); setDeviceDropdownOpen(false); }}
                >
                  {d.hostname}
                </button>
              ))}
              {filteredDevices.length === 0 && (
                <p className="px-3 py-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No devices match</p>
              )}
            </div>
          )}
        </div>

        {/* Method filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.4)" }}>Method</label>
          <select
            value={filterMethod}
            onChange={(e) => setFilter("method", e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.07)", border: filterMethod ? "1px solid rgba(125,217,74,0.4)" : "1px solid rgba(255,255,255,0.12)", color: "#f0f8ec", outline: "none" }}
          >
            <option value="">All Methods</option>
            <option value="fruit">🍎 Fruit</option>
            <option value="branch">🌿 Branch</option>
            <option value="bushel">🧺 Bushel</option>
            <option value="orchard">🌳 Orchard</option>
          </select>
        </div>

        {/* Mode filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.4)" }}>Mode</label>
          <select
            value={filterMode}
            onChange={(e) => setFilter("mode", e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.07)", border: filterMode ? "1px solid rgba(125,217,74,0.4)" : "1px solid rgba(255,255,255,0.12)", color: "#f0f8ec", outline: "none" }}
          >
            <option value="">All Modes</option>
            <option value="silent">Silent</option>
            <option value="managed">Managed</option>
            <option value="prompted">User Prompted</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.4)" }}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilter("status", e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#f0f8ec", outline: "none" }}
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="running">In Progress</option>
            <option value="queued">Pending</option>
          </select>
        </div>

        {/* Date range filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.4)" }}>Date Range</label>
          <select
            value={filterDate}
            onChange={(e) => setFilter("date", e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#f0f8ec", outline: "none" }}
          >
            <option value="all">All Time</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>

        {/* App search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.4)" }}>App / Label</label>
          <input
            type="text"
            value={filterApp}
            onChange={(e) => setFilter("app", e.target.value)}
            placeholder="Search apps…"
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#f0f8ec", outline: "none" }}
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => router.replace("/patches")}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            Clear filters ×
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={glassPanel}>
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Job Log
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {total} patch job{total !== 1 ? "s" : ""}{hasFilters ? " matching filters" : ""} · click a row to expand log output
          </p>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#7dd94a" }} />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList
              className="h-8 w-8 mx-auto mb-3"
              style={{ color: "rgba(255,255,255,0.2)" }}
            />
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              No patch jobs yet
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              Patch jobs will appear here once you start deploying updates.
            </p>
          </div>
        ) : filteredJobs.length === 0 && hasFilters ? (
          <div className="text-center py-16">
            <ClipboardList className="h-8 w-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>No jobs match the current filters</p>
            <button onClick={() => router.replace("/patches")} className="text-xs mt-2 underline" style={{ color: "rgba(255,255,255,0.35)" }}>Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(0,0,0,0.2)",
                  }}
                >
                  {["App", "Method", "Mode", "Status", "Device", "Initiated By", "Started", "Duration", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, idx) => (
                  <JobRows key={job.jobId} job={job} index={idx} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatchesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#7dd94a" }} />
      </div>
    }>
      <PatchesPageInner />
    </Suspense>
  );
}
