"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { getAgentStore } from "@/lib/agentStore";
import { appInitials, appColorClass } from "@/lib/utils";

type PatchJob = {
  jobId: string;
  appName: string;
  status: "success" | "failed" | "running" | "queued";
  startedAt: string;
};

const glassPanel: React.CSSProperties = {
  backgroundColor: "var(--surface-glass)",
  backgroundImage: "var(--sheen)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid var(--border-hairline)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-card)",
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
        const fleetRes = await fetch(`/api/patch-jobs`, {
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
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div
          style={{ display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}
        >
          <BarChart3 className="h-5 w-5" style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Reports
          </h1>
          <p style={{ fontSize: 12, marginTop: 2, color: "var(--text-tertiary)" }}>
            Fleet patch status and compliance overview
          </p>
        </div>
      </div>

      {/* Agent offline notice */}
      {agentOffline && (
        <div
          style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, borderRadius: 16, padding: "12px 16px", background: "color-mix(in srgb, var(--st-outdated) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--st-outdated) 25%, transparent)" }}
        >
          <WifiOff className="h-4 w-4 shrink-0" style={{ color: "var(--st-outdated)" }} />
          <p style={{ fontSize: 14, color: "var(--st-outdated)" }}>
            Agent offline — some data may be unavailable.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {/* Patch Summary */}
        <div style={{ ...glassPanel, borderRadius: 16, overflow: "hidden" }}>
          <div
            style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-hairline)" }}
          >
            <p
              style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}
            >
              Patch Summary
            </p>
          </div>
          <div style={{ padding: "16px 20px" }}>
            {patchLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0" }}>
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--accent)" }} />
              </div>
            ) : totalPatched === 0 ? (
              <p style={{ fontSize: 14, padding: "24px 0", textAlign: "center", color: "var(--text-tertiary)" }}>
                No patch history available yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  <div
                    style={{ borderRadius: 12, padding: "12px 16px", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)" }}
                  >
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, color: "var(--text-tertiary)" }}>
                      Total Patches
                    </p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
                      {totalPatched}
                    </p>
                  </div>
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)" }}
                  >
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, color: "var(--text-tertiary)" }}>
                      Success Rate
                    </p>
                    <p
                      style={{ fontSize: 24, fontWeight: 700, color: successRate === null ? "var(--text-tertiary)" : successRate >= 90 ? "var(--st-current)" : successRate >= 70 ? "var(--st-outdated)" : "var(--st-lagging)" }}
                    >
                      {successRate !== null ? `${successRate}%` : "—"}
                    </p>
                  </div>
                </div>
                {mostPatchedApp && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold ${appColorClass(mostPatchedApp)}`}
                    >
                      {appInitials(mostPatchedApp)}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                        Most patched app
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                        {mostPatchedApp}{" "}
                        <span style={{ color: "var(--text-tertiary)" }}>
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
            style={{ borderBottom: "1px solid var(--border-hairline)" }}
          >
            <p
              style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}
            >
              Fleet Health
            </p>
          </div>
          <div style={{ padding: "16px 20px" }}>
            {apps.length === 0 ? (
              <p style={{ fontSize: 14, padding: "24px 0", textAlign: "center", color: "var(--text-tertiary)" }}>
                No inventory data — connect the agent to see fleet health.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Up-to-date gauge */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                      Apps up to date
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--st-current)" }}>
                      {pctUpToDate !== null ? `${pctUpToDate}%` : "—"}
                    </span>
                  </div>
                  <div
                    style={{ height: 8, borderRadius: 9999, overflow: "hidden", background: "var(--surface-raised)" }}
                  >
                    <div
                      style={{ height: "100%", borderRadius: 9999, transition: "width 0.3s", width: `${pctUpToDate ?? 0}%`, background: (pctUpToDate ?? 0) >= 80 ? "var(--st-current)" : (pctUpToDate ?? 0) >= 60 ? "var(--st-outdated)" : "var(--st-lagging)" }}
                    />
                  </div>
                  <p style={{ fontSize: 12, marginTop: 6, color: "var(--text-tertiary)" }}>
                    {upToDateApps.length} of {apps.length} apps consistent across fleet
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, padding: "10px 12px", background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "var(--st-current)" }} />
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: "var(--st-current)" }}>
                        {upToDateApps.length}
                      </p>
                      <p style={{ fontSize: 10, marginTop: 2, color: "var(--text-tertiary)" }}>
                        Up to date
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, padding: "10px 12px", background: "color-mix(in srgb, var(--st-outdated) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--st-outdated) 20%, transparent)" }}>
                    <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--st-outdated)" }} />
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: "var(--st-outdated)" }}>
                        {outdatedApps.length}
                      </p>
                      <p style={{ fontSize: 10, marginTop: 2, color: "var(--text-tertiary)" }}>
                        With conflicts
                      </p>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {devices.length} device{devices.length !== 1 ? "s" : ""} in inventory
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Outdated Apps */}
        <div style={{ ...glassPanel, borderRadius: 16, overflow: "hidden", gridColumn: "span 2" }}>
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-hairline)" }}
          >
            <p
              style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}
            >
              Top Outdated Apps
            </p>
            <p style={{ fontSize: 12, marginTop: 2, color: "var(--text-tertiary)" }}>
              Apps with version conflicts, ranked by install count
            </p>
          </div>
          {topOutdated.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              {apps.length === 0 ? (
                <>
                  <ShieldCheck style={{ width: 32, height: 32, margin: "0 auto 8px", color: "var(--text-tertiary)" }} />
                  <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>
                    Connect the agent to see outdated apps.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 style={{ width: 32, height: 32, margin: "0 auto 8px", color: "var(--st-current)" }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--st-current)" }}>
                    All apps are up to date!
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              {topOutdated.map((app, idx) => (
                <div
                  key={app.id}
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderTop: idx > 0 ? "1px solid var(--border-hairline)" : "none", background: idx % 2 === 1 ? "color-mix(in srgb, var(--surface-glass) 50%, transparent)" : "transparent" }}
                >
                  <span style={{ fontSize: 12, width: 20, textAlign: "right", flexShrink: 0, color: "var(--text-tertiary)" }}>
                    {idx + 1}
                  </span>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold ${appColorClass(app.name)}`}
                  >
                    {appInitials(app.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>
                      {app.name}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                      {app.mostCommonVersion}
                      {(app as { latestVersion?: string }).latestVersion
                        ? ` → ${(app as { latestVersion?: string }).latestVersion}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--st-outdated)" }}>
                      {app.totalInstalls}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                      devices
                    </p>
                  </div>
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, flexShrink: 0, background: "color-mix(in srgb, var(--st-outdated) 12%, transparent)", color: "var(--st-outdated)", border: "1px solid color-mix(in srgb, var(--st-outdated) 30%, transparent)" }}
                  >
                    <AlertTriangle className="h-3 w-3" /> Outdated
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coverage */}
        <div style={{ ...glassPanel, borderRadius: 16, padding: "20px", gridColumn: "span 2" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div
              style={{ display: "flex", width: 40, height: 40, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 12, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}
            >
              <ShieldCheck className="h-5 w-5" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>
                Installomator Coverage
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--st-current)", fontWeight: 600 }}>
                  {apps.length > 0 ? apps.length : "—"}
                </span>{" "}
                of{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>1,100+</span>{" "}
                supported Installomator apps detected on your fleet.{" "}
                {apps.length > 0 && (
                  <>
                    <span style={{ color: "var(--st-current)" }}>
                      {upToDateApps.length} consistent
                    </span>
                    {outdatedApps.length > 0 && (
                      <>
                        ,{" "}
                        <span style={{ color: "var(--st-outdated)" }}>
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
