'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/Topbar';

interface AppStatus {
  id: string;
  device_id: string;
  name: string;
  bundle_id?: string;
  source?: string;
  version: string;
  latest_version: string | null;
  patch_status: 'outdated' | 'current' | 'unknown' | 'na' | 'store';
  label?: string;
}

interface Device {
  id: string;
  hostname: string;
}

interface Stats {
  totalDevices: number;
  totalApps: number;
  outdatedApps: number;
  totalInstalls: number;
  lastCheckin: string;
}

function LegendRow({ color, label, value, href }: { color: string; label: string; value: number | null; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13.5,
        textDecoration: "none",
        cursor: "pointer",
        opacity: hovered ? 0.7 : 1,
        transition: "opacity 0.15s",
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color, flexShrink: 0, display: "inline-block" }} />
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ marginLeft: "auto", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
        {value === null ? "—" : value}
      </span>
    </Link>
  );
}

function PinSlot() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1.5px dashed ${hovered ? "var(--accent)" : "var(--border-strong)"}`,
        borderRadius: "var(--r-lg)",
        padding: 30,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 9,
        color: hovered ? "var(--accent)" : "var(--text-tertiary)",
        transition: "border-color 0.2s, color 0.2s",
        cursor: "default",
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22, opacity: 0.8 }}>
        <path d="M9 4v6l-2 4h10l-2-4V4"/><path d="M12 18v3M8 4h8"/>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 500 }}>Pin an app</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [allAppsStatus, setAllAppsStatus] = useState<AppStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showOrchardModal, setShowOrchardModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'silent' | 'managed' | 'prompted'>('silent');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [orchardLoading, setOrchardLoading] = useState(false);

  const loadData = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setSyncing(true); else setLoading(true);
    try {
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      const devicesRes = await fetch('/api/devices');
      const devicesData = await devicesRes.json();
      const deviceList = devicesData.devices || [];
      setDevices(deviceList);

      const allApps: AppStatus[] = [];
      for (const device of deviceList) {
        const statusRes = await fetch(`/api/apps/status?device_id=${device.id}`);
        const statusData = await statusRes.json();
        allApps.push(...(statusData.apps || []));
      }
      setAllAppsStatus(allApps);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  const refreshStats = useCallback(() => loadData({ silent: true }), [loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  // Deduplicate allAppsStatus by bundle_id (or name), keeping worst-case status
  const statusPriority: Record<string, number> = { outdated: 4, unknown: 3, current: 2, na: 1 };
  const deduped = new Map<string, AppStatus>();
  for (const app of allAppsStatus) {
    const key = app.bundle_id || app.name;
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, app);
    } else {
      const existingPriority = statusPriority[existing.patch_status] ?? 0;
      const newPriority = statusPriority[app.patch_status] ?? 0;
      if (newPriority > existingPriority) deduped.set(key, app);
    }
  }
  const dedupedApps = Array.from(deduped.values());

  const statusCounts = {
    outdated: dedupedApps.filter(a => a.patch_status === 'outdated').length,
    current:  dedupedApps.filter(a => a.patch_status === 'current').length,
    unknown:  dedupedApps.filter(a => a.patch_status === 'unknown').length,
    system:   dedupedApps.filter(a => a.patch_status === 'na' && a.source !== 'mas').length,
    store:    dedupedApps.filter(a => a.source === 'mas').length,
  };

  // Top outdated apps aggregated by label
  const outdatedByLabel = new Map<string, { label: string; name: string; bundleId: string | null; devices: Set<string>; version: string; latest: string | null }>();
  dedupedApps
    .filter(a => a.patch_status === 'outdated')
    .forEach(app => {
      const key = app.label || app.name;
      if (!outdatedByLabel.has(key)) {
        outdatedByLabel.set(key, { label: key, name: app.name, bundleId: app.bundle_id ?? null, devices: new Set(), version: app.version, latest: app.latest_version });
      }
      outdatedByLabel.get(key)!.devices.add(app.device_id);
    });

  const topOutdated = Array.from(outdatedByLabel.values())
    .map(item => ({
      label: item.label,
      name: item.name,
      bundleId: item.bundleId,
      deviceCount: item.devices.size,
      version: item.version,
      latest: item.latest,
    }))
    .sort((a, b) => b.deviceCount - a.deviceCount)
    .slice(0, 6);

  const handleOrchardConfirm = async () => {
    if (!confirmCheckbox) return;
    setOrchardLoading(true);
    try {
      const res = await fetch('/api/patch-jobs/orchard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error || 'Failed to queue jobs'}`);
        return;
      }
      setShowOrchardModal(false);
      router.push(`/patches?method=orchard`);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOrchardLoading(false);
    }
  };

  // Donut segments (percentages) -- all five categories
  const total = statusCounts.outdated + statusCounts.current + statusCounts.unknown + statusCounts.system + statusCounts.store;
  const pOut = total > 0 ? (statusCounts.outdated / total) * 100 : 0;
  const pCur = total > 0 ? (statusCounts.current  / total) * 100 : 0;
  const pUnk = total > 0 ? (statusCounts.unknown  / total) * 100 : 0;
  const pSys = total > 0 ? (statusCounts.system   / total) * 100 : 0;
  const pStr = 100 - pOut - pCur - pUnk - pSys;
  const donutGrad = total > 0
    ? `conic-gradient(var(--st-outdated) 0 ${pOut}%, var(--st-current) ${pOut}% ${pOut + pCur}%, var(--st-unknown) ${pOut + pCur}% ${pOut + pCur + pUnk}%, var(--st-system) ${pOut + pCur + pUnk}% ${pOut + pCur + pUnk + pSys}%, var(--st-store) ${pOut + pCur + pUnk + pSys}% 100%)`
    : `conic-gradient(var(--st-unknown) 0 100%)`;

  function displayVersion(v: string) { return v ? v.split(',')[0] : v; }

  const cardStyle: React.CSSProperties = {
    position: "relative",
    backgroundColor: "var(--surface-glass)",
    backgroundImage: "var(--sheen)",
    WebkitBackdropFilter: "blur(20px) saturate(150%)",
    backdropFilter: "blur(20px) saturate(150%)",
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--r-xl)",
    boxShadow: "var(--shadow-card)",
    padding: "22px 24px",
    transition: "background-color 0.5s, box-shadow 0.5s",
  };

  const cardHead: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  };

  return (
    <>
      <Topbar type="dashboard" title="Fleet Dashboard" subtitle="Monitor your device fleet and manage patches" onSyncNow={syncing ? undefined : refreshStats} />

      <div style={{ padding: "26px 30px 48px", maxWidth: 1480, width: "100%" }}>

        {/* 5 Metric cards */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { glow: "var(--st-outdated-glow)", dot: "var(--st-outdated)", dotGlow: "var(--st-outdated-glow)", label: "Outdated",  href: "/apps?status=outdated", value: statusCounts.outdated, numColor: "var(--st-outdated-text)", foot: "Patchable Now" },
            { glow: "var(--st-current-glow)",  dot: "var(--st-current)",  dotGlow: "var(--st-current-glow)",  label: "Current",   href: "/apps?status=current",  value: statusCounts.current,  numColor: "var(--st-current-text)",  foot: "Up to Date" },
            { glow: "var(--st-unknown-glow)",  dot: "var(--st-unknown)",  dotGlow: undefined,                 label: "Unknown",   href: "/apps?status=unknown",  value: statusCounts.unknown,  numColor: "var(--text-primary)",     foot: "No Label Yet" },
            { glow: "var(--st-system-glow)",   dot: "var(--st-system)",   dotGlow: undefined,                 label: "System",    href: "/apps?status=system",   value: statusCounts.system,   numColor: "var(--text-primary)",     foot: "Apple Managed" },
            { glow: "var(--st-store-glow)",    dot: "var(--st-store)",    dotGlow: "var(--st-store-glow)",    label: "App Store", href: "/apps?status=mas",      value: statusCounts.store,    numColor: "var(--text-primary)",     foot: "Mac App Store" },
          ].map(m => (
            <Link key={m.label} href={m.href} style={{
              display: "block",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "var(--surface-glass)",
              backgroundImage: `radial-gradient(150px 95px at 100% -12%, ${m.glow}, transparent 70%), var(--sheen)`,
              WebkitBackdropFilter: "blur(18px) saturate(150%)",
              backdropFilter: "blur(18px) saturate(150%)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-card)",
              padding: "15px 17px 16px",
              transition: "background-color 0.5s, box-shadow 0.5s",
              cursor: "pointer",
              textDecoration: "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.dot, boxShadow: m.dotGlow ? `0 0 9px ${m.dotGlow}` : undefined, display: "inline-block" }} />
                {m.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 11, lineHeight: 1, color: m.numColor }}>
                {loading ? "—" : m.value}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 7 }}>{m.foot}</div>
            </Link>
          ))}
        </section>

        {/* 2-col grid: fleet health + top outdated */}
        <section style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 18, marginBottom: 18 }}>
          {/* Fleet health */}
          <div style={cardStyle}>
            <div style={cardHead}>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Fleet Health</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
              {/* Donut */}
              <div style={{ position: "relative", width: 184, height: 184, flexShrink: 0, alignSelf: "center" }}>
                <div style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: donutGrad,
                  WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 26px), #000 calc(100% - 26px))",
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 26px), #000 calc(100% - 26px))",
                }} />
                <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center" }}>
                  <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--st-outdated-text)", lineHeight: 1 }}>
                    {loading ? "—" : statusCounts.outdated}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>outdated</div>
                </div>
              </div>
              {/* Legend */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, flex: 1 }}>
                {[
                  { color: "var(--st-outdated)", label: "Outdated",  value: statusCounts.outdated, href: "/apps?status=outdated" },
                  { color: "var(--st-current)",  label: "Current",   value: statusCounts.current,  href: "/apps?status=current" },
                  { color: "var(--st-unknown)",  label: "Unknown",   value: statusCounts.unknown,  href: "/apps?status=unknown" },
                  { color: "var(--st-system)",   label: "System",    value: statusCounts.system,   href: "/apps?status=system" },
                  { color: "var(--st-store)",    label: "App Store", value: statusCounts.store,    href: "/apps?status=mas" },
                ].map(row => (
                  <LegendRow key={row.label} color={row.color} label={row.label} value={loading ? null : row.value} href={row.href} />
                ))}
              </div>
            </div>
          </div>

          {/* Top outdated apps */}
          <div style={cardStyle}>
            <div style={cardHead}>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Top Outdated Apps</span>
              <Link href="/apps" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                View All
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </Link>
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto", overflowX: "hidden" }}>
            {loading ? (
              <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Loading…</div>
            ) : topOutdated.length === 0 ? (
              <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>No outdated apps</div>
            ) : topOutdated.map((app, idx) => {
              const slug = app.bundleId ? app.bundleId.replace(/\./g, "-") : null;
              const rowContent = (
                <>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    display: "grid", placeItems: "center",
                    fontSize: 15, fontWeight: 600,
                    color: "var(--accent)",
                    background: "var(--accent-tint)",
                    boxShadow: "inset 0 1px 0 var(--rim-top), inset 0 0 0 1px rgba(98,184,106,0.14)",
                  }}>
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{app.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1, fontVariantNumeric: "tabular-nums" }}>
                      {displayVersion(app.version)}{" "}
                      {app.latest && <b style={{ color: "var(--st-outdated-text)", fontWeight: 600 }}>→ {displayVersion(app.latest)}</b>}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: "var(--st-outdated-text)",
                    background: "var(--st-outdated-tint)",
                    padding: "5px 11px",
                    borderRadius: "var(--r-pill)",
                    whiteSpace: "nowrap",
                  }}>
                    {app.deviceCount} device{app.deviceCount !== 1 ? "s" : ""}
                  </span>
                </>
              );
              const rowStyle: React.CSSProperties = {
                display: "flex", alignItems: "center", gap: 13, padding: "12px 4px",
                borderBottom: idx < topOutdated.length - 1 ? "1px solid var(--border-hairline)" : undefined,
                cursor: slug ? "pointer" : "default",
                textDecoration: "none",
              };
              return slug ? (
                <Link key={app.label} href={`/apps/${slug}`} style={rowStyle}>
                  {rowContent}
                </Link>
              ) : (
                <div key={app.label} style={rowStyle}>
                  {rowContent}
                </div>
              );
            })}
            </div>
          </div>
        </section>

        {/* Patch by the Orchard */}
        <section style={{
          ...cardStyle,
          marginBottom: 18,
          padding: "22px 24px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 13, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: "var(--accent-tint)",
              display: "grid", placeItems: "center",
              boxShadow: "inset 0 1px 0 var(--rim-top)",
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 21, height: 21, color: "var(--accent)" }}>
                <path d="M12 22V12"/><path d="M12 12c0-4 3-7 7-7 0 4-3 7-7 7z"/><path d="M12 15c0-3.2-3-5.8-7-5.8 0 3.2 3 5.8 7 5.8z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>OrchardPatch</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Queue Patches Across Your Entire Fleet</p>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--notice-bg)",
            border: "1px solid var(--notice-border)",
            borderRadius: "var(--r-md)",
            padding: "11px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "var(--notice-text)",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>
            </svg>
            This queues patch jobs on every device in your fleet. Review before you confirm.
          </div>
          <button
            onClick={() => { setConfirmCheckbox(false); setSelectedMode('silent'); setShowOrchardModal(true); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "-0.005em",
              background: "var(--accent-grad)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: "var(--r-md)",
              padding: "12px 20px",
              boxShadow: "var(--shadow-accent)",
              transition: "filter 0.14s, transform 0.08s",
              cursor: "pointer",
              transform: "translateZ(0)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v5h-5"/>
            </svg>
            Patch All Outdated · {statusCounts.outdated} Apps · {devices.length} Devices
          </button>
        </section>

        {/* Pinned apps */}
        <section>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", margin: "4px 0 14px" }}>Pinned apps</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 12 }}>
            {[1, 2, 3].map(i => (
              <PinSlot key={i} />
            ))}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
            Pin the apps you watch most for one-tap access. Coming soon.
          </div>
        </section>
      </div>

      {/* Orchard confirmation modal */}
      {showOrchardModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{
            background: "var(--surface-solid)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--shadow-card)",
            maxWidth: 560,
            width: "calc(100% - 32px)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", gap: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 21, height: 21, color: "var(--accent)", flexShrink: 0 }}>
                <path d="M12 22V12"/><path d="M12 12c0-4 3-7 7-7 0 4-3 7-7 7z"/><path d="M12 15c0-3.2-3-5.8-7-5.8 0 3.2 3 5.8 7 5.8z"/>
              </svg>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Patch the Fleet</h2>
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 1 }}>Review everything that will be patched</p>
              </div>
            </div>

            {/* App list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              {topOutdated.length > 0 ? topOutdated.map(app => (
                <div key={app.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-hairline)" }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{app.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1, fontFamily: "var(--mono)" }}>{app.label}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--st-outdated-text)", background: "var(--st-outdated-tint)", padding: "4px 10px", borderRadius: "var(--r-pill)" }}>
                    {app.deviceCount} device{app.deviceCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )) : (
                <p style={{ color: "var(--text-tertiary)", fontSize: 13 }}>No outdated apps</p>
              )}
            </div>

            {/* Summary */}
            <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border-hairline)", fontSize: 13, color: "var(--text-secondary)", background: "var(--surface-sunken)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{topOutdated.length} apps</strong> across{" "}
              <strong style={{ color: "var(--text-primary)" }}>{devices.length} devices</strong> —{" "}
              <strong style={{ color: "var(--text-primary)" }}>{statusCounts.outdated} total patch jobs</strong>
            </div>

            {/* Mode selector */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-hairline)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>Patch mode</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {(['silent', 'managed', 'prompted'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--r-md)",
                      border: `2px solid ${selectedMode === mode ? "var(--accent)" : "var(--border-hairline)"}`,
                      background: selectedMode === mode ? "var(--accent-tint)" : "var(--surface-glass)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      transition: "border-color 0.14s",
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{mode}</p>
                    {mode === 'managed' && <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>recommended</p>}
                  </button>
                ))}
              </div>
            </div>

            {/* Notice */}
            <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border-hairline)", background: "var(--notice-bg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--notice-text)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>
                </svg>
                This will affect your entire fleet
              </div>
            </div>

            {/* Confirm checkbox */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-hairline)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--text-primary)" }}>
                <input type="checkbox" checked={confirmCheckbox} onChange={e => setConfirmCheckbox(e.target.checked)} style={{ width: 16, height: 16 }} />
                I understand this will affect my entire fleet
              </label>
            </div>

            {/* Buttons */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-hairline)", background: "var(--surface-sunken)" }}>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowOrchardModal(false)}
                disabled={orchardLoading}
                style={{
                  padding: "9px 16px", borderRadius: "var(--r-md)",
                  border: "1px solid var(--border-hairline)",
                  background: "var(--surface-glass)",
                  color: "var(--text-primary)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleOrchardConfirm}
                disabled={!confirmCheckbox || orchardLoading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "9px 18px",
                  borderRadius: "var(--r-md)",
                  background: confirmCheckbox ? "var(--accent-grad)" : "var(--surface-sunken)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "#fff",
                  fontSize: 13, fontWeight: 600,
                  cursor: confirmCheckbox ? "pointer" : "not-allowed",
                  opacity: !confirmCheckbox || orchardLoading ? 0.6 : 1,
                  boxShadow: confirmCheckbox ? "var(--shadow-accent)" : "none",
                }}
              >
                {orchardLoading ? "Starting…" : "Start patching"}
              </button>
              </div>
              <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8, letterSpacing: "0.02em" }}>Patch by the Orchard · All Outdated Apps, Entire Fleet</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
