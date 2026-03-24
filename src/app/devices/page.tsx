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
    <div className="p-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a2e" }}>Devices</h1>
          <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
            {stats.totalDevices.toLocaleString()} device{stats.totalDevices !== 1 ? "s" : ""} in fleet
            {dataSource === "agent" && lastSync && (
              <span className="ml-2" style={{ color: "#9ca3af" }}>
                · synced {formatRelativeDate(lastSync)}
              </span>
            )}
          </p>
        </div>
        {dataSource === "agent" && (
          <button
            onClick={loadAgentData}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
            style={{ background: "#f0f7e8", color: "#2d5016", border: "1px solid #c5e1a5" }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Total Devices", value: stats.totalDevices },
          { label: "macOS Versions", value: new Set(devices.map(d => d.osVersion)).size },
          { label: "Avg Apps / Device", value: devices.length > 0 ? Math.round(devices.reduce((s, d) => s + d.apps.length, 0) / devices.length) : 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-white px-5 py-4"
            style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            <div className="text-2xl font-bold" style={{ color: "#1a1a2e" }}>{stat.value.toLocaleString()}</div>
            <div className="mt-0.5 text-xs font-medium uppercase tracking-wide" style={{ color: "#6b7280" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Device table */}
      <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div
          className="grid grid-cols-12 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide"
          style={{ background: "#f8f9fa", borderBottom: "1px solid #e2e4e7", color: "#6b7280" }}
        >
          <div className="col-span-4">Device Name</div>
          <div className="col-span-2">Model</div>
          <div className="col-span-2">macOS</div>
          <div className="col-span-2">Apps Installed</div>
          <div className="col-span-2">Last Inventory</div>
        </div>

        {sorted.map((device, i) => (
          <Link
            key={device.id}
            href={`/devices/${device.id}`}
            className="grid grid-cols-12 px-4 py-3 items-center transition-colors hover:bg-[#f5f6f7]"
            style={{ borderBottom: i < sorted.length - 1 ? "1px solid #f0f1f3" : "none" }}
          >
            <div className="col-span-4 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded" style={{ background: "#eef0f2" }}>
                <Laptop className="h-4 w-4" style={{ color: "#6b7280" }} />
              </div>
              <span className="text-sm font-semibold hover:text-[#2d5016] transition-colors" style={{ color: "#1a1a2e" }}>
                {device.name}
              </span>
            </div>
            <div className="col-span-2 text-sm" style={{ color: "#6b7280" }}>{device.model}</div>
            <div className="col-span-2">
              <span className="inline-block rounded px-2 py-0.5 text-xs font-medium" style={{ background: "#eef7ff", color: "#0071BC" }}>
                {macOSName(device.osVersion) ? `${macOSName(device.osVersion)} ${device.osVersion}` : device.osVersion}
              </span>
            </div>
            <div className="col-span-2 text-sm font-medium" style={{ color: "#1a1a2e" }}>
              {device.apps.length}
              <span className="font-normal text-xs ml-1" style={{ color: "#6b7280" }}>apps</span>
            </div>
            <div className="col-span-2 text-sm" style={{ color: "#6b7280" }}>
              {formatRelativeDate(device.lastInventory)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
