"use client";

import { useState, useEffect, useCallback } from "react";
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
type PatchStatus = "success" | "failed" | "running" | "queued";

type PatchJob = {
  jobId: string;
  appName: string;
  bundleId: string;
  mode: PatchMode;
  status: PatchStatus;
  deviceId: string;
  deviceName: string;
  startedAt: string;
  completedAt?: string;
  log?: string;
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

function ModeBadge({ mode }: { mode: PatchMode }) {
  const styles: Record<PatchMode, React.CSSProperties> = {
    silent: {
      background: "rgba(255,255,255,0.08)",
      color: "rgba(255,255,255,0.55)",
      border: "1px solid rgba(255,255,255,0.12)",
    },
    managed: {
      background: "rgba(125,217,74,0.12)",
      color: "#9fe066",
      border: "1px solid rgba(125,217,74,0.3)",
    },
    prompted: {
      background: "rgba(100,181,246,0.12)",
      color: "#90caf9",
      border: "1px solid rgba(100,181,246,0.3)",
    },
  };
  const labels: Record<PatchMode, string> = {
    silent: "Silent",
    managed: "Managed",
    prompted: "User Prompted",
  };
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={styles[mode]}
    >
      {labels[mode]}
    </span>
  );
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
          <ModeBadge mode={job.mode} />
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={job.status} />
        </td>
        <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          {job.deviceName}
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
      {expanded && job.log && (
        <tr style={{ background: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <td colSpan={7} className="px-4 pb-3 pt-0">
            <pre
              className="text-[11px] font-mono leading-relaxed rounded-lg px-4 py-3 mt-1 overflow-x-auto"
              style={{
                background: "rgba(0,0,0,0.4)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {job.log}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PatchesPage() {
  const [jobs, setJobs] = useState<PatchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentOffline, setAgentOffline] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      // Try fleet server first, fall back to local agent
      const fleetRes = await fetch(`${FLEET_SERVER_URL}/patch-jobs`, {
        headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
      }).catch(() => null);

      if (fleetRes?.ok) {
        const data = await fleetRes.json();
        // Normalize fleet patch jobs to local format
        const jobs = (data.jobs || []).map((j: any) => ({
          id: j.id,
          appName: j.app_name,
          label: j.label,
          mode: j.mode,
          status: j.status,
          deviceId: j.device_id,
          deviceName: j.device_name || j.device_id,
          createdAt: j.created_at,
          startedAt: j.started_at,
          completedAt: j.completed_at,
          exitCode: j.exit_code,
          error: j.error,
          log: j.log ? j.log.split("\n") : [],
        }));
        setJobs(jobs);
        setAgentOffline(false);
        return;
      }

      const res = await fetch("http://localhost:47652/patch", {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : (data.jobs ?? []));
      setAgentOffline(false);
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

  const total = jobs.length;
  const succeeded = jobs.filter((j) => j.status === "success").length;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const running = jobs.filter((j) => j.status === "running").length;
  const successRate =
    succeeded + failed > 0 ? Math.round((succeeded / (succeeded + failed)) * 100) : 0;
  const lastJob =
    jobs.length > 0
      ? jobs.reduce((a, b) => (new Date(a.startedAt) > new Date(b.startedAt) ? a : b))
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
            {total} patch job{total !== 1 ? "s" : ""} · click a row to expand log output
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
                  {["App", "Mode", "Status", "Device", "Started", "Duration", ""].map((h) => (
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
                {jobs.map((job, idx) => (
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
