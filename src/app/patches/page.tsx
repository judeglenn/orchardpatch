"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
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
  Ban,
  AlertTriangle,
} from "lucide-react";
import { appInitials, appColorClass, formatRelativeDate, formatDateTime, getJobSummary } from "@/lib/utils";

type PatchMode = "silent" | "managed" | "prompted";
type PatchMethod = "fruit" | "branch" | "bushel" | "orchard";
type PatchStatus = "success" | "failed" | "running" | "queued" | "cancelled";

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
  createdAt: string;
  startedAt: string;
  completedAt?: string;
  exitCode?: number | null;
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
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 30 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 30 * 1000).toISOString(),
    log: "",
  },
];

const glassPanel: React.CSSProperties = {
  backgroundColor: "var(--surface-glass)",
  backgroundImage: "var(--sheen)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid var(--border-hairline)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-card)",
};

function formatDuration(startedAt: string, completedAt?: string): string {
  if (!completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function MethodBadge({ method }: { method?: string | null }) {
  const cfg: Record<string, { label: string; emoji: string; bg: string; color: string; border: string; title: string }> = {
    fruit:   { label: "Fruit",   emoji: "🍎", bg: "color-mix(in srgb, var(--st-current) 10%, transparent)", color: "var(--st-current)", border: "color-mix(in srgb, var(--st-current) 30%, transparent)", title: "Patch by the Fruit — single app, single device" },
    branch:  { label: "Branch",  emoji: "🌿", bg: "color-mix(in srgb, var(--st-current) 10%, transparent)", color: "var(--st-current)", border: "color-mix(in srgb, var(--st-current) 30%, transparent)", title: "Patch by the Branch — all outdated apps, single device" },
    bushel:  { label: "Bushel",  emoji: "🧺", bg: "color-mix(in srgb, var(--st-outdated) 10%, transparent)", color: "var(--st-outdated)", border: "color-mix(in srgb, var(--st-outdated) 30%, transparent)", title: "Patch by the Bushel — single app, all devices" },
    orchard: { label: "Orchard", emoji: "🌳", bg: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)", border: "color-mix(in srgb, var(--accent) 30%, transparent)", title: "Patch by the Orchard — all outdated apps, entire fleet" },
  };
  const m = method && cfg[method] ? cfg[method] : null;
  if (!m) return <span style={{ color: "var(--text-tertiary)" }}>—</span>;
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,  background: m.bg, color: m.color, border: `1px solid ${m.border}` }}
      title={m.title}
    >
      {m.emoji} {m.label}
    </span>
  );
}

function ModeBadge({ mode }: { mode?: string | null }) {
  if (mode === "silent") return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,  background: "var(--surface-raised)", color: "var(--text-secondary)", border: "1px solid var(--border-hairline)" }}>
      Silent
    </span>
  );
  if (mode === "managed") return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,  background: "var(--accent-tint)", color: "var(--st-current)", border: "1px solid var(--border-accent)" }}>
      Managed
    </span>
  );
  if (mode === "prompted") return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,  background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)" }}>
      User Prompted
    </span>
  );
  return <span style={{ color: "var(--text-tertiary)" }}>—</span>;
}

function StatusBadge({ status }: { status: PatchStatus }) {
  if (status === "success") {
    return (
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, 
          background: "var(--accent-tint)",
          color: "var(--st-current)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <CheckCircle2 className="h-3 w-3" /> Success
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, 
          background: "color-mix(in srgb, var(--st-lagging) 12%, transparent)",
          color: "var(--st-lagging)",
          border: "1px solid color-mix(in srgb, var(--st-lagging) 30%, transparent)",
        }}
      >
        <XCircle className="h-3 w-3" /> Failed
      </span>
    );
  }
  if (status === "running") {
    return (
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, 
          background: "color-mix(in srgb, var(--st-outdated) 12%, transparent)",
          color: "var(--st-outdated)",
          border: "1px solid color-mix(in srgb, var(--st-outdated) 30%, transparent)",
        }}
      >
        <Loader2 className="h-3 w-3 animate-spin" /> Running
      </span>
    );
  }
  if (status === "queued") {
    return (
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, 
          background: "var(--surface-raised)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        <Clock className="h-3 w-3" /> Queued
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, 
          background: "color-mix(in srgb, var(--st-unknown) 12%, transparent)",
          color: "var(--st-unknown)",
          border: "1px solid color-mix(in srgb, var(--st-unknown) 30%, transparent)",
        }}
      >
        <Ban className="h-3 w-3" /> Cancelled
      </span>
    );
  }
  // Loud fallback — any unhandled status value renders visibly wrong on purpose
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, 
        background: "color-mix(in srgb, var(--st-lagging) 12%, transparent)",
        color: "var(--st-lagging)",
        border: "1px solid color-mix(in srgb, var(--st-lagging) 30%, transparent)",
      }}
    >
      <AlertTriangle className="h-3 w-3" /> Unknown: {status}
    </span>
  );
}

function JobRows({ job, index, cancellingId, onCancel, undoSecondsLeft }: { job: PatchJob; index: number; cancellingId: string | null; onCancel: (jobId: string) => Promise<void>; undoSecondsLeft: number }) {
  const [expanded, setExpanded] = useState(false);
  const initials = appInitials(job.appName);
  const colorClass = appColorClass(job.appName);

  return (
    <>
      <tr
        className="border-b transition-colors"
        style={{
          background: index % 2 === 1 ? "color-mix(in srgb, var(--surface-glass) 50%, transparent)" : "transparent",
          borderColor: "var(--border-hairline)",
          cursor: job.log ? "pointer" : "default",
        }}
        onClick={() => job.log && setExpanded((e) => !e)}
      >
        <td style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold ${colorClass}`}
            >
              {initials}
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {job.appName}
            </span>
          </div>
        </td>
        <td style={{ padding: "12px 16px" }}>
          <MethodBadge method={job.method} />
        </td>
        <td style={{ padding: "12px 16px" }}>
          <ModeBadge mode={job.mode} />
        </td>
        <td style={{ padding: "12px 16px" }}>
          <StatusBadge status={job.status} />
        </td>
        <td style={{ padding: "12px 16px", fontSize: 14, color: "var(--text-secondary)" }}>
          {job.deviceName}
        </td>
        <td style={{ padding: "12px 16px", fontSize: 14, color: "var(--text-tertiary)" }}>
          {job.initiatedBy ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}
        </td>
        <td style={{ padding: "12px 16px", fontSize: 14, color: "var(--text-secondary)" }}>
          {formatDateTime(job.startedAt)}
        </td>
        <td style={{ padding: "12px 16px", fontSize: 14, fontFamily: "monospace", color: "var(--text-tertiary)" }}>
          {formatDuration(job.startedAt, job.completedAt)}
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center" }}>
          {job.status === "queued" && job.mode === "silent" && undoSecondsLeft > 0 ? (
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(job.jobId);
                }}
                disabled={cancellingId === job.jobId}
                className="text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-0.5 rounded"
                style={{
                  color: cancellingId === job.jobId ? "var(--text-tertiary)" : "var(--st-outdated)",
                  border: "1px solid color-mix(in srgb, var(--st-outdated) 40%, transparent)",
                  background: "color-mix(in srgb, var(--st-outdated) 8%, transparent)",
                }}
              >
                {cancellingId === job.jobId ? "Cancelling..." : "Undo (" + undoSecondsLeft + "s)"}
              </button>
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                Silent patch
              </span>
            </div>
          ) : job.status === "queued" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(job.jobId);
              }}
              disabled={cancellingId === job.jobId}
              className="text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: cancellingId === job.jobId ? "var(--text-tertiary)" : "var(--st-lagging)",
              }}
            >
              {cancellingId === job.jobId ? "Cancelling..." : "Cancel"}
            </button>
          ) : null}
        </td>
        
        <td style={{ padding: "12px 16px", textAlign: "right" }}>
          {job.log ? (
            <span style={{ color: "var(--text-tertiary)" }}>
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          ) : null}
        </td>
      </tr>
      {expanded && job.log && (() => {
        const logStr = Array.isArray(job.log) ? (job.log as string[]).join("\n") : (job.log as string);
        const lines = logStr.split("\n");
        return (
          <tr style={{ background: "color-mix(in srgb, var(--page-bg) 80%, transparent)", borderBottom: "1px solid var(--border-hairline)" }}>
            <td colSpan={10} style={{ padding: "8px 16px 12px" }}>
              {/* TL;DR summary */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: "var(--text-tertiary)" }}>TL;DR</p>
                <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{getJobSummary(job.status, job.exitCode ?? null)}</p>
              </div>
              <div style={{ borderTop: "1px solid var(--border-hairline)", marginBottom: "8px" }} />
              <div
                style={{ fontSize: 11, fontFamily: "monospace", lineHeight: 1.6, borderRadius: 8, padding: "12px 16px" }}
                style={{
                  background: "color-mix(in srgb, var(--page-bg) 60%, transparent)",
                  border: "1px solid var(--border-hairline)",
                  maxHeight: "320px",
                  overflowY: "auto",
                }}
              >
                {lines.map((line, i) => {
                  const u = line.toUpperCase();
                  let color = "var(--text-secondary)";
                  if (/ERROR|FAILED|EXIT CODE [^0]|EXITED WITH/.test(u)) color = "var(--st-lagging)";
                  else if (/WARNING|WARN/.test(u)) color = "var(--st-outdated)";
                  else if (/SUCCESS|SUCCESSFULLY/.test(u)) color = "var(--st-current)";
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
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [devices, setDevices] = useState<{ id: string; hostname: string }[]>([]);
  const [deviceQuery, setDeviceQuery] = useState("");
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const deviceInputRef = useRef<HTMLDivElement>(null);
  const [dropdownAnchor, setDropdownAnchor] = useState<{ top: number; left: number } | null>(null);
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
        fetch(`/api/patch-jobs?limit=500`).catch(() => null),
        fetch(`/api/devices`).catch(() => null),
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

  // 1-second tick to keep undo countdown live while any silent queued jobs are in-window
  useEffect(() => {
    const hasWindowJob = jobs.some(j =>
      j.status === "queued" &&
      j.mode === "silent" &&
      (Date.now() - new Date(j.createdAt).getTime()) < 15000
    );
    if (!hasWindowJob) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [jobs, tick]);

  const undoSecondsLeft = (createdAt: string): number => {
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(15 - elapsed));
  };

  // ─── Filtered jobs ──────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter((j) => {
      if (filterDevice && j.deviceId !== filterDevice) return false;
      if (filterStatus && j.status !== filterStatus) return false;
      if (filterMethod && j.method !== filterMethod) return false;
      if (filterMode && j.mode !== filterMode) return false;
      if (filterDate !== "all" && !isWithinDateRange(j.startedAt, filterDate)) return false;
      if (filterApp && !j.appName?.toLowerCase().includes(filterApp.toLowerCase()) &&
          !j.label?.toLowerCase().includes(filterApp.toLowerCase())) return false;
      return true;
    });
    // Sort by startedAt descending (createdAt fallback for queued/cancelled jobs)
    return filtered.sort((a, b) => {
      const aT = new Date(a.startedAt || a.createdAt).getTime();
      const bT = new Date(b.startedAt || b.createdAt).getTime();
      return bT - aT;
    });
  }, [jobs, filterDevice, filterStatus, filterMethod, filterMode, filterDate, filterApp]);

  const hasFilters = filterDevice || filterStatus || filterMethod || filterMode || (filterDate && filterDate !== "all") || filterApp;

  const total = filteredJobs.length;
  const succeeded = filteredJobs.filter((j) => j.status === "success").length;
  const failed = filteredJobs.filter((j) => j.status === "failed").length;
  const running = filteredJobs.filter((j) => j.status === "running").length;
  const successRate =
    succeeded + failed > 0 ? Math.round((succeeded / (succeeded + failed)) * 100) : null;
  const lastJob =
    filteredJobs.length > 0
      ? filteredJobs.reduce((a, b) => (new Date(a.startedAt) > new Date(b.startedAt) ? a : b))
      : null;

  async function handleCancel(jobId: string) {
    setCancellingId(jobId);
    try {
      const res = await fetch(`/api/patch-jobs/${encodeURIComponent(jobId)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Failed to cancel: ${data.error || "Unknown error"}`);
        setCancellingId(null);
        return;
      }

      // Re-fetch jobs from server to get authoritative state
      setCancellingId(null);
      setTimeout(() => {
        fetchJobs();
      }, 250);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setCancellingId(null);
    }
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "var(--accent-tint)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <ClipboardList className="h-5 w-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Patch History
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {lastRefresh
                ? `Last updated ${formatRelativeDate(lastRefresh.toISOString())}`
                : "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={fetchJobs}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "8px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-secondary)",
          }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Offline banner */}
      {agentOffline && (
        <div
          style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, borderRadius: 16, padding: "12px 16px", background: "color-mix(in srgb, var(--st-outdated) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--st-outdated) 25%, transparent)" }}
        >
          <WifiOff className="h-4 w-4 shrink-0" style={{ color: "var(--st-outdated)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--st-outdated)" }}>
              Agent offline — showing sample data
            </p>
            <p className="text-xs mt-0.5" style={{ color: "color-mix(in srgb, var(--st-outdated) 70%, transparent)" }}>
              Start the OrchardPatch agent to see real patch history.
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Jobs", value: String(total), color: "var(--text-primary)" },
          {
            label: "Success Rate",
            value: successRate !== null ? `${successRate}%` : "—",
            color:
              successRate === null ? "var(--text-tertiary)" : successRate >= 90 ? "var(--st-current)" : successRate >= 70 ? "var(--st-outdated)" : "var(--st-lagging)",
          },
          {
            label: "Running",
            value: String(running),
            color: running > 0 ? "var(--st-outdated)" : "var(--text-secondary)",
          },
          {
            label: "Last Patch",
            value: lastJob ? formatDateTime(lastJob.startedAt) : "—",
            color: "var(--text-secondary)",
          },
        ].map((stat) => (
          <div key={stat.label} style={{ ...glassPanel, borderRadius: 16, padding: "16px 20px" }}>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1"
              style={{ color: "var(--text-tertiary)" }}
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
      <div style={{ ...glassPanel, borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", overflow: "visible", position: "relative", zIndex: 20 }}>
        {/* Device typeahead */}
        <div className="flex flex-col gap-1 relative" ref={deviceInputRef}>
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Device</label>
          <input
            type="text"
            value={deviceDropdownOpen ? deviceQuery : (filterDeviceHostname || deviceQuery)}
            placeholder="Search devices…"
            onFocus={() => {
              setDeviceQuery("");
              setDeviceDropdownOpen(true);
              if (deviceInputRef.current) {
                const r = deviceInputRef.current.getBoundingClientRect();
                setDropdownAnchor({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX });
              }
            }}
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
              background: "var(--surface-raised)",
              border: filterDevice ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          {deviceDropdownOpen && dropdownAnchor && typeof document !== "undefined" && createPortal(
            <div
              style={{
                position: "absolute",
                top: dropdownAnchor.top,
                left: dropdownAnchor.left,
                width: "208px",
                background: "var(--surface-glass)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--border-hairline)",
                boxShadow: "var(--shadow-card)",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 9999,
                borderRadius: "12px",
              }}
            >
              <button
                className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/5"
                style={{ color: !filterDevice ? "var(--accent)" : "var(--text-tertiary)" }}
                onMouseDown={() => { setFilter("device_id", ""); setDeviceQuery(""); setDeviceDropdownOpen(false); }}
              >
                All Devices
              </button>
              {filteredDevices.map((d) => (
                <button
                  key={d.id}
                  className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/5"
                  style={{ color: filterDevice === d.id ? "var(--accent)" : "var(--text-primary)" }}
                  onMouseDown={() => { setFilter("device_id", d.id); setDeviceQuery(d.hostname); setDeviceDropdownOpen(false); }}
                >
                  {d.hostname}
                </button>
              ))}
              {filteredDevices.length === 0 && (
                <p className="px-3 py-2 text-xs" style={{ color: "var(--text-tertiary)" }}>No devices match</p>
              )}
            </div>,
            document.body
          )}
        </div>

        {/* Method filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Method</label>
          <select
            value={filterMethod}
            onChange={(e) => setFilter("method", e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "var(--surface-raised)", border: filterMethod ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", color: "var(--text-primary)", outline: "none" }}
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
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Mode</label>
          <select
            value={filterMode}
            onChange={(e) => setFilter("mode", e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "var(--surface-raised)", border: filterMode ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", color: "var(--text-primary)", outline: "none" }}
          >
            <option value="">All Modes</option>
            <option value="silent">Silent</option>
            <option value="managed">Managed</option>
            <option value="prompted">User Prompted</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilter("status", e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", outline: "none" }}
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="running">In Progress</option>
            <option value="queued">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date range filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Date Range</label>
          <select
            value={filterDate}
            onChange={(e) => setFilter("date", e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", outline: "none" }}
          >
            <option value="all">All Time</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>

        {/* App search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>App / Label</label>
          <input
            type="text"
            value={filterApp}
            onChange={(e) => setFilter("app", e.target.value)}
            placeholder="Search apps…"
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", outline: "none" }}
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => router.replace("/patches")}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-tertiary)" }}
          >
            Clear filters ×
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ ...glassPanel, borderRadius: 16, overflow: "hidden" }}>
        <div
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-hairline)" }}
        >
          <p
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}
          >
            Job Log
          </p>
          <p style={{ fontSize: 12, marginTop: 2, color: "var(--text-tertiary)" }}>
            {total} patch job{total !== 1 ? "s" : ""}{hasFilters ? " matching filters" : ""} · click a row to expand log output
          </p>
        </div>

        {loading && jobs.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <ClipboardList
              style={{ width: 32, height: 32, margin: "0 auto 12px" }}
              style={{ color: "var(--text-tertiary)" }}
            />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              No patch jobs yet
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Patch jobs will appear here once you start deploying updates.
            </p>
          </div>
        ) : filteredJobs.length === 0 && hasFilters ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <ClipboardList style={{ width: 32, height: 32, margin: "0 auto 12px" }} style={{ color: "var(--text-tertiary)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No jobs match the current filters</p>
            <button onClick={() => router.replace("/patches")} className="text-xs mt-2 underline" style={{ color: "var(--text-tertiary)" }}>Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-hairline)",
                    background: "color-mix(in srgb, var(--page-bg) 40%, transparent)",
                  }}
                >
                  {["App", "Method", "Mode", "Status", "Device", "Initiated By", "Started", "Duration", "", ""].map((h) => (
                    <th
                      key={h}
                      style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, idx) => (
                  <JobRows key={job.jobId} job={job} index={idx} cancellingId={cancellingId} onCancel={handleCancel} undoSecondsLeft={job.status === "queued" && job.mode === "silent" ? undoSecondsLeft(job.createdAt) : 0} />
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
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    }>
      <PatchesPageInner />
    </Suspense>
  );
}
