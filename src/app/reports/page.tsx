"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { getAgentStore } from "@/lib/agentStore";
import { FLEET_SERVER_URL, FLEET_SERVER_TOKEN } from "@/lib/fleetServer";
import { appInitials, appColorClass } from "@/lib/utils";

type PatchJob = {
  jobId: string;
  appName: string;
  status: "success" | "failed" | "running" | "queued";
  startedAt: string;
};

const glassPanel: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
};

export default function ReportsPage() {
  const [patchJobs, setPatchJobs] = useState<PatchJob[]>([]);
  const [patchLoading, setPatchLoading] = useState(true);
  const [agentOffline, setAgentOffline] = useState(false);

  const agentStore = getAgentStore();
  const apps = agentStore.apps ?? [];
  const devices = agentStore.devices ?? [];

  useEffect(() => {
    async function load() {
      setPatchLoading(true);
      try {
        // Try fleet server first
        const fleetRes = await fetch(`${FLEET_SERVER_URL}/patch-jobs`, {
          headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
          signal: AbortSignal.timeout(6000),
        }).catch(() => null);

        if (fleetRes?.ok) {
          const data = await fleetRes.json();
          const jobs = (data.jobs || []).map((j: any) => ({
            jobId: j.id,
            appName: j.app_name,
            status: j.status,
            startedAt: j.started_at || j.created_at,
            deviceName: j.device_name,
          }));
          setPatchJobs(jobs);
          setAgentOffline(false);
          return;
        }

        // Fall back to local agent
        const res = await fetch("http://localhost:47652/patch", {
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPatchJobs(Array.isArray(data) ? data : (data.jobs ?? []));
        setAgentOffline(false);
      } catch {
        setAgentOffline(true);
        setPatchJobs([]);
      } finally {
        setPatchLoading(false);
      }
    }
    load();
  }, []);

  // Patch summary metrics
  const totalPatched = patchJobs.length;
  const succeeded = patchJobs.filter((j) => j.status === "success").length;
  const failed = patchJobs.filter((j) => j.status === "failed").length;
  const successRate =
    succeeded + failed > 0 ? Math.round((succeeded / (succeeded + failed)) * 100) : null;

  // Most patched app
  const appPatchCounts: Record<string, number> = {};
  for (const job of patchJobs) {
    appPatchCounts[job.appName] = (appPatchCounts[job.appName] ?? 0) + 1;
  }
  const mostPatchedApp =
    Object.entries(appPatchCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Fleet health
  const outdatedApps = apps.filter((a) => a.hasVersionConflict);
  const upToDateApps = apps.filter((a) => !a.hasVersionConflict);
  const pctUpToDate =
    apps.length > 0 ? Math.round((upToDateApps.length / apps.length) * 100) : null;

  // Top outdated apps (by install count)
  const topOutdated = outdatedApps
    .sort((a, b) => b.totalInstalls - a.totalInstalls)
    .slice(0, 5);

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: "rgba(125,217,74,0.12)",
            border: "1px solid rgba(125,217,74,0.25)",
          }}
        >
          <BarChart3 className="h-5 w-5" style={{ color: "#7dd94a" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#f0f8ec" }}>
            Reports
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Fleet patch status and compliance overview
          </p>
        </div>
      </div>

      {/* Agent offline notice */}
      {agentOffline && (
        <div
          className="mb-5 flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: "rgba(255,183,77,0.08)",
            border: "1px solid rgba(255,183,77,0.25)",
          }}
        >
          <WifiOff className="h-4 w-4 shrink-0" style={{ color: "#ffb74d" }} />
          <p className="text-sm" style={{ color: "#ffb74d" }}>
            Agent offline — some data may be unavailable.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Patch Summary */}
        <div className="rounded-2xl overflow-hidden" style={glassPanel}>
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Patch Summary
            </p>
          </div>
          <div className="px-5 py-4">
            {patchLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#7dd94a" }} />
              </div>
            ) : totalPatched === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                No patch history available yet.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Total Patches
                    </p>
                    <p className="text-2xl font-bold" style={{ color: "#f0f8ec" }}>
                      {totalPatched}
                    </p>
                  </div>
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Success Rate
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{
                        color:
                          successRate === null
                            ? "rgba(255,255,255,0.4)"
                            : successRate >= 90
                            ? "#9fe066"
                            : successRate >= 70
                            ? "#ffb74d"
                            : "#ef9a9a",
                      }}
                    >
                      {successRate !== null ? `${successRate}%` : "—"}
                    </p>
                  </div>
                </div>
                {mostPatchedApp && (
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold ${appColorClass(mostPatchedApp)}`}
                    >
                      {appInitials(mostPatchedApp)}
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Most patched app
                      </p>
                      <p className="text-sm font-medium" style={{ color: "#f0f8ec" }}>
                        {mostPatchedApp}{" "}
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>
                          ({appPatchCounts[mostPatchedApp]} jobs)
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fleet Health */}
        <div className="rounded-2xl overflow-hidden" style={glassPanel}>
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Fleet Health
            </p>
          </div>
          <div className="px-5 py-4">
            {apps.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                No inventory data — connect the agent to see fleet health.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Up-to-date gauge */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                      Apps up to date
                    </span>
                    <span className="text-sm font-bold" style={{ color: "#9fe066" }}>
                      {pctUpToDate !== null ? `${pctUpToDate}%` : "—"}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pctUpToDate ?? 0}%`,
                        background:
                          (pctUpToDate ?? 0) >= 80
                            ? "#7dd94a"
                            : (pctUpToDate ?? 0) >= 60
                            ? "#ffb74d"
                            : "#ef5350",
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {upToDateApps.length} of {apps.length} apps consistent across fleet
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(125,217,74,0.06)", border: "1px solid rgba(125,217,74,0.15)" }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#9fe066" }} />
                    <div>
                      <p className="text-lg font-bold leading-none" style={{ color: "#9fe066" }}>
                        {upToDateApps.length}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Up to date
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(255,160,0,0.06)", border: "1px solid rgba(255,160,0,0.15)" }}>
                    <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#ffb74d" }} />
                    <div>
                      <p className="text-lg font-bold leading-none" style={{ color: "#ffb74d" }}>
                        {outdatedApps.length}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        With conflicts
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {devices.length} device{devices.length !== 1 ? "s" : ""} in inventory
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Outdated Apps */}
        <div className="rounded-2xl overflow-hidden lg:col-span-2" style={glassPanel}>
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Top Outdated Apps
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Apps with version conflicts, ranked by install count
            </p>
          </div>
          {topOutdated.length === 0 ? (
            <div className="text-center py-10">
              {apps.length === 0 ? (
                <>
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Connect the agent to see outdated apps.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2" style={{ color: "#7dd94a" }} />
                  <p className="text-sm font-medium" style={{ color: "#9fe066" }}>
                    All apps are up to date!
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {topOutdated.map((app, idx) => (
                <div
                  key={app.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{ background: idx % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent" }}
                >
                  <span className="text-xs w-5 text-right shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {idx + 1}
                  </span>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold ${appColorClass(app.name)}`}
                  >
                    {appInitials(app.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: "#f0f8ec" }}>
                      {app.name}
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {app.mostCommonVersion}
                      {(app as { latestVersion?: string }).latestVersion
                        ? ` → ${(app as { latestVersion?: string }).latestVersion}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold" style={{ color: "#ffb74d" }}>
                      {app.totalInstalls}
                    </p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                      devices
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      background: "rgba(255,160,0,0.12)",
                      color: "#ffb74d",
                      border: "1px solid rgba(255,160,0,0.3)",
                    }}
                  >
                    <AlertTriangle className="h-3 w-3" /> Outdated
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coverage */}
        <div className="rounded-2xl px-5 py-5 lg:col-span-2" style={glassPanel}>
          <div className="flex items-start gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(125,217,74,0.12)", border: "1px solid rgba(125,217,74,0.2)" }}
            >
              <ShieldCheck className="h-5 w-5" style={{ color: "#7dd94a" }} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#f0f8ec" }}>
                Installomator Coverage
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                <span style={{ color: "#9fe066", fontWeight: 600 }}>
                  {apps.length > 0 ? apps.length : "—"}
                </span>{" "}
                of{" "}
                <span style={{ color: "#f0f8ec", fontWeight: 600 }}>1,100+</span>{" "}
                supported Installomator apps detected on your fleet.{" "}
                {apps.length > 0 && (
                  <>
                    <span style={{ color: "#9fe066" }}>
                      {upToDateApps.length} consistent
                    </span>
                    {outdatedApps.length > 0 && (
                      <>
                        ,{" "}
                        <span style={{ color: "#ffb74d" }}>
                          {outdatedApps.length} with version conflicts
                        </span>
                      </>
                    )}
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
