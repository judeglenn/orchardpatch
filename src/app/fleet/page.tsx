"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Monitor, AlertTriangle, CheckCircle2, RefreshCw, Wifi } from "lucide-react";
import { appInitials, appColorClass, formatRelativeDate } from "@/lib/utils";
import { devices as mockDevices } from "@/lib/mockData";

interface FleetDevice {
  id: string;
  hostname: string;
  model: string;
  os_version: string;
  agent_version: string;
  last_seen: string;
  app_count: number;
  outdated_count: number;
}

interface FleetStats {
  totalDevices: number;
  totalApps: number;
  outdatedApps: number;
  totalInstalls: number;
  lastCheckin: string;
  patchJobs: { total: number; success: number; failed: number };
}

const glass: React.CSSProperties = { backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", borderRadius: "16px", boxShadow: "var(--shadow-card)" };

export default function FleetPage() {
  const [devices, setDevices] = useState<FleetDevice[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [patchCounts, setPatchCounts] = useState<{ outdated: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, devicesRes, patchStatusRes] = await Promise.all([
        fetch(`/api/stats`),
        fetch(`/api/devices`),
        fetch(`/api/stats/patch-status`),
      ]);
      const statsData = await statsRes.json();
      const devicesData = await devicesRes.json();
      setStats(statsData);
      setDevices(devicesData.devices || []);
      if (patchStatusRes.ok) {
        const pd = await patchStatusRes.json();
        setPatchCounts({ outdated: pd.outdated });
      }
      setLastRefresh(prev => new Date());
    } catch (err) {
      console.error("Fleet fetch failed, falling back to mock data:", err);
      // Fall back to mock data
      const mockFleetDevices: FleetDevice[] = mockDevices.map(d => ({
        id: d.id,
        hostname: d.name,
        model: d.model,
        os_version: d.osVersion,
        agent_version: "demo",
        last_seen: d.lastInventory,
        app_count: d.apps.length,
        outdated_count: 0,
      }));
      setDevices(mockFleetDevices);
      setStats({
        totalDevices: mockDevices.length,
        totalApps: 87,
        outdatedApps: 3,
        totalInstalls: 174,
        lastCheckin: new Date().toISOString(),
        patchJobs: { total: 0, success: 0, failed: 0 },
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>Fleet</h1>
          <p style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 6, color: "var(--text-tertiary)" }}>
            <Wifi className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
            {"orchardpatch-server-production.up.railway.app"}{lastRefresh ? ` · last refresh ${lastRefresh.toLocaleTimeString()}` : ""}
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border-hairline)" }}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Devices", value: stats.totalDevices, color: "var(--st-current)" },
            { label: "Total Apps", value: stats.totalApps, color: "var(--text-primary)" },
            { label: "Outdated", value: patchCounts?.outdated ?? stats.outdatedApps, color: (patchCounts?.outdated ?? stats.outdatedApps) > 0 ? "var(--st-outdated)" : "var(--st-current)" },
            { label: "Patches Run", value: stats.patchJobs.total, color: "var(--text-primary)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...glass, padding: "16px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, color: "var(--text-secondary)" }}>{label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Device list */}
      <div style={glass}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-hairline)" }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
            Managed Devices {devices.length > 0 && `(${devices.length})`}
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
            <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent" }} />
          </div>
        ) : devices.length === 0 ? (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>No devices reporting yet</p>
            <p style={{ fontSize: 12, marginTop: 4, color: "var(--text-tertiary)" }}>Install the agent pkg and configure it to report to the central server</p>
          </div>
        ) : (
          <div>
            {devices.map((device) => (
              <Link key={device.id} href={`/fleet/devices/${encodeURIComponent(device.id)}`} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderTop: "1px solid var(--border-hairline)", cursor: "pointer", textDecoration: "none" }}>
                {/* Icon */}
                <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)" }}>
                  <Monitor className="h-5 w-5" style={{ color: "var(--accent)" }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>{device.hostname}</p>
                    {device.outdated_count > 0 ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, flexShrink: 0, background: "color-mix(in srgb, var(--st-outdated) 15%, transparent)", color: "var(--st-outdated)", border: "1px solid color-mix(in srgb, var(--st-outdated) 30%, transparent)" }}>
                        <AlertTriangle style={{ width: 10, height: 10 }} />
                        {device.outdated_count} outdated
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, flexShrink: 0, background: "var(--accent-tint)", color: "var(--st-current)", border: "1px solid var(--border-accent)" }}>
                        <CheckCircle2 style={{ width: 10, height: 10 }} />
                        Up to date
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-tertiary)" }}>
                    {device.model || "Mac"} · {device.os_version || "macOS"} · {device.app_count} apps
                  </p>
                </div>

                {/* Last seen */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    {device.last_seen ? formatRelativeDate(device.last_seen) : "—"}
                  </p>
                  <p style={{ fontSize: 10, marginTop: 2, color: "var(--text-tertiary)" }}>
                    agent {device.agent_version || "unknown"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Server info */}
      <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
        <Wifi style={{ width: 14, height: 14, flexShrink: 0, color: "var(--accent)" }} />
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Fleet data from <span style={{ color: "var(--accent)" }}>orchardpatch-server-production.up.railway.app</span> · agents check in every 15 min
        </p>
      </div>
    </div>
  );
}
