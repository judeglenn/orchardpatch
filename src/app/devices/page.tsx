"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { devices as mockDevices, stats as mockStats } from "@/lib/mockData";
import { Laptop, RefreshCw } from "lucide-react";
import { macOSName, formatRelativeDate } from "@/lib/utils";
import { checkAgent, fetchLocalInventory, normalizeAgentInventory } from "@/lib/agent";

export default function DevicesPage() {
  const [devices, setDevices] = useState(mockDevices);
  const [stats, setStats] = useState(mockStats);
  const [dataSource, setDataSource] = useState<"mock" | "agent">("mock");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function loadAgentData() {
    const { connected } = await checkAgent();
    if (!connected) return;
    setSyncing(true);
    try {
      const raw = await fetchLocalInventory();
      const normalized = normalizeAgentInventory(raw);
      setDevices(normalized.devices as typeof mockDevices);
      setStats(normalized.stats);
      setDataSource("agent");
      setLastSync(new Date().toISOString());
    } catch {
      // fall back to mock silently
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadAgentData();
  }, []);

  const sorted = [...devices].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ padding: 32 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Devices</h1>
          <p style={{ marginTop: 4, fontSize: 14, color: "var(--text-secondary)" }}>
            {stats.totalDevices.toLocaleString()} device{stats.totalDevices !== 1 ? "s" : ""} in fleet
            {dataSource === "agent" && lastSync && (
              <span style={{ marginLeft: 8, color: "var(--text-tertiary)" }}>
                · synced {formatRelativeDate(lastSync)}
              </span>
            )}
          </p>
        </div>
        {dataSource === "agent" && (
          <button
            onClick={loadAgentData}
            disabled={syncing}
            style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "var(--accent-tint)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Total Devices", value: stats.totalDevices },
          { label: "macOS Versions", value: new Set(devices.map(d => d.osVersion)).size },
          { label: "Avg Apps / Device", value: devices.length > 0 ? Math.round(devices.reduce((s, d) => s + d.apps.length, 0) / devices.length) : 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ borderRadius: 16, padding: "16px 20px", backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>{stat.value.toLocaleString()}</div>
            <div style={{ marginTop: 2, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Device table */}
      <div
        style={{ borderRadius: 16, overflow: "hidden", backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", padding: "12px 16px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", background: "color-mix(in srgb, var(--page-bg) 40%, transparent)", borderBottom: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
        >
          <div style={{ gridColumn: "span 4" }}>Device Name</div>
          <div style={{ gridColumn: "span 2" }}>Model</div>
          <div style={{ gridColumn: "span 2" }}>macOS</div>
          <div style={{ gridColumn: "span 2" }}>Apps Installed</div>
          <div style={{ gridColumn: "span 2" }}>Last Inventory</div>
        </div>

        {sorted.map((device, i) => (
          <Link
            key={device.id}
            href={`/devices/${device.id}`}
            style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", padding: "12px 16px", alignItems: "center", borderBottom: i < sorted.length - 1 ? "1px solid var(--border-hairline)" : "none", background: i % 2 === 1 ? "color-mix(in srgb, var(--surface-glass) 50%, transparent)" : "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--surface-glass) 80%, transparent)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? "color-mix(in srgb, var(--surface-glass) 50%, transparent)" : "transparent")}
          >
            <div style={{ gridColumn: "span 4", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", width: 32, height: 32, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 6, background: "var(--surface-raised)" }}>
                <Laptop style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                {device.name}
              </span>
            </div>
            <div style={{ gridColumn: "span 2", fontSize: 14, color: "var(--text-secondary)" }}>{device.model}</div>
            <div style={{ gridColumn: "span 2" }}>
              <span style={{ display: "inline-block", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 500, background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)" }}>
                {macOSName(device.osVersion) ? `${macOSName(device.osVersion)} ${device.osVersion}` : device.osVersion}
              </span>
            </div>
            <div style={{ gridColumn: "span 2", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
              {device.apps.length}
              <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 4, color: "var(--text-secondary)" }}>apps</span>
            </div>
            <div style={{ gridColumn: "span 2", fontSize: 14, color: "var(--text-secondary)" }}>
              {formatRelativeDate(device.lastInventory)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
