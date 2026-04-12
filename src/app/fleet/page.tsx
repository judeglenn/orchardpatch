"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Monitor, AlertTriangle, CheckCircle2, RefreshCw, Wifi } from "lucide-react";
import { FLEET_SERVER_URL, FLEET_SERVER_TOKEN } from "@/lib/fleetServer";
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

const glass = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
} as React.CSSProperties;

export default function FleetPage() {
  const [devices, setDevices] = useState<FleetDevice[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, devicesRes] = await Promise.all([
        fetch(`${FLEET_SERVER_URL}/stats`, { headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN } }),
        fetch(`${FLEET_SERVER_URL}/devices`, { headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN } }),
      ]);
      const statsData = await statsRes.json();
      const devicesData = await devicesRes.json();
      setStats(statsData);
      setDevices(devicesData.devices || []);
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
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f8ec" }}>Fleet</h1>
          <p className="text-sm flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Wifi className="h-3.5 w-3.5" style={{ color: "#7dd94a" }} />
            {FLEET_SERVER_URL.replace("https://", "")}{lastRefresh ? ` · last refresh ${lastRefresh.toLocaleTimeString()}` : ""}
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.08)", color: "#f0f8ec", border: "1px solid rgba(255,255,255,0.12)" }}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Devices", value: stats.totalDevices, color: "#7dd94a" },
            { label: "Total Apps", value: stats.totalApps, color: "#f0f8ec" },
            { label: "Outdated", value: stats.outdatedApps, color: stats.outdatedApps > 0 ? "#ffb74d" : "#7dd94a" },
            { label: "Patches Run", value: stats.patchJobs.total, color: "#f0f8ec" },
          ].map(({ label, value, color }) => (
            <div key={label} style={glass} className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Device list */}
      <div style={glass}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
            Managed Devices {devices.length > 0 && `(${devices.length})`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-[#7dd94a] border-t-transparent animate-spin" />
          </div>
        ) : devices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No devices reporting yet</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Install the agent pkg and configure it to report to the central server</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {devices.map((device) => (
              <Link key={device.id} href={`/fleet/devices/${encodeURIComponent(device.id)}`} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer">
                {/* Icon */}
                <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Monitor className="h-5 w-5" style={{ color: "#7dd94a" }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold truncate" style={{ color: "#f0f8ec" }}>{device.hostname}</p>
                    {device.outdated_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(255,152,0,0.15)", color: "#ffb74d", border: "1px solid rgba(255,152,0,0.3)" }}>
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {device.outdated_count} outdated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(125,217,74,0.12)", color: "#7dd94a", border: "1px solid rgba(125,217,74,0.25)" }}>
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Up to date
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {device.model || "Mac"} · {device.os_version || "macOS"} · {device.app_count} apps
                  </p>
                </div>

                {/* Last seen */}
                <div className="text-right shrink-0">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {device.last_seen ? formatRelativeDate(device.last_seen) : "—"}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                    agent {device.agent_version || "unknown"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Server info */}
      <div className="mt-4 px-4 py-3 rounded-xl flex items-center gap-2"
        style={{ background: "rgba(125,217,74,0.06)", border: "1px solid rgba(125,217,74,0.15)" }}>
        <Wifi className="h-3.5 w-3.5 shrink-0" style={{ color: "#7dd94a" }} />
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          Fleet data from <span style={{ color: "#7dd94a" }}>{FLEET_SERVER_URL.replace("https://", "")}</span> · agents check in every 15 min
        </p>
      </div>
    </div>
  );
}
