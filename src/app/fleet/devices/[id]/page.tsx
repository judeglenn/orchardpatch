"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Monitor, AlertTriangle, CheckCircle2, ChevronLeft, Package, Clock, RefreshCw } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { FLEET_SERVER_URL, FLEET_SERVER_TOKEN } from "@/lib/fleetServer";
import { PatchStatusBadge, type PatchStatus } from "@/components/PatchStatusBadge";

interface DeviceApp {
  id: number;
  bundle_id: string;
  name: string;
  version: string;
  latest_version: string | null;
  patch_status: PatchStatus;
  label: string | null;
  cache_age_seconds: number | null;
}

interface FleetDevice {
  id: string;
  hostname: string;
  serial: string | null;
  model: string | null;
  os_version: string | null;
  ram: string | null;
  cpu: string | null;
  agent_version: string | null;
  last_seen: string | null;
}

const glass = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
} as React.CSSProperties;

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [device, setDevice] = useState<FleetDevice | null>(null);
  const [apps, setApps] = useState<DeviceApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDevice() {
      setLoading(true);
      setError(null);
      try {
        const headers = { "x-orchardpatch-token": FLEET_SERVER_TOKEN };
        const [deviceRes, appsRes] = await Promise.all([
          fetch(`${FLEET_SERVER_URL}/devices/${encodeURIComponent(id)}`, { headers }),
          fetch(`${FLEET_SERVER_URL}/apps/status?device_id=${encodeURIComponent(id)}`, { headers }),
        ]);
        if (!deviceRes.ok) throw new Error(deviceRes.status === 404 ? "Device not found" : `Device fetch failed (${deviceRes.status})`);
        if (!appsRes.ok) throw new Error(`App status fetch failed (${appsRes.status})`);
        const deviceData = await deviceRes.json();
        const appsData = await appsRes.json();
        setDevice(deviceData);
        setApps(appsData.apps ?? []);
      } catch (err: any) {
        setError(err.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchDevice();
  }, [id]);

  const outdatedApps = apps.filter(a => a.patch_status === "outdated");
  const currentApps = apps.filter(a => a.patch_status === "current");
  const unknownApps = apps.filter(a => a.patch_status === "unknown");

  if (loading) {
    return (
      <div className="px-6 py-6 flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="px-6 py-6">
        <Link href="/fleet" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: "#7dd94a" }}>
          <ChevronLeft className="h-4 w-4" /> Back to Fleet
        </Link>
        <div style={glass} className="px-6 py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" style={{ color: "#ffb74d" }} />
          <p className="text-lg font-semibold mb-2" style={{ color: "#f0f8ec" }}>{error || "Device not found"}</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Could not load device <code className="font-mono text-xs">{id}</code> from fleet server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <Link href="/fleet" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: "#7dd94a" }}>
        <ChevronLeft className="h-4 w-4" /> Back to Fleet
      </Link>

      {/* Device info card */}
      <div style={glass} className="px-6 py-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(125,217,74,0.15)", border: "1px solid rgba(125,217,74,0.25)" }}>
            <Monitor className="h-6 w-6" style={{ color: "#7dd94a" }} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#f0f8ec" }}>{device.hostname}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              {device.model && <span>{device.model}</span>}
              {device.model && device.os_version && <span>·</span>}
              {device.os_version && <span>{device.os_version}</span>}
              {device.serial && <><span>·</span><span className="font-mono text-xs">{device.serial}</span></>}
            </div>
            {(device.ram || device.cpu) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                {device.ram && <span>{device.ram}</span>}
                {device.ram && device.cpu && <span>·</span>}
                {device.cpu && <span>{device.cpu}</span>}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {outdatedApps.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(239,83,80,0.15)", color: "#ef5350", border: "1px solid rgba(239,83,80,0.3)" }}>
                  <AlertTriangle className="h-3 w-3" />
                  {outdatedApps.length} outdated
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(125,217,74,0.12)", color: "#7dd94a", border: "1px solid rgba(125,217,74,0.25)" }}>
                  <CheckCircle2 className="h-3 w-3" />
                  All up to date
                </span>
              )}
            </div>
            {device.last_seen && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Last seen: {formatRelativeDate(device.last_seen)}
              </p>
            )}
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
              Agent {device.agent_version || "unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div style={glass} className="px-5 py-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5" style={{ color: "#7dd94a" }} />
            <div>
              <p className="text-2xl font-bold" style={{ color: "#f0f8ec" }}>{apps.length}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Total Apps</p>
            </div>
          </div>
        </div>
        <div style={glass} className="px-5 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" style={{ color: outdatedApps.length > 0 ? "#ef5350" : "rgba(255,255,255,0.2)" }} />
            <div>
              <p className="text-2xl font-bold" style={{ color: outdatedApps.length > 0 ? "#ef5350" : "#f0f8ec" }}>
                {outdatedApps.length}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Outdated</p>
            </div>
          </div>
        </div>
        <div style={glass} className="px-5 py-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5" style={{ color: "rgba(255,255,255,0.55)" }} />
            <div>
              <p className="text-lg font-bold" style={{ color: "#f0f8ec" }}>
                {device.last_seen ? formatRelativeDate(device.last_seen) : "—"}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Last Check-in</p>
            </div>
          </div>
        </div>
      </div>

      {/* Outdated apps */}
      {outdatedApps.length > 0 && (
        <div style={glass} className="mb-4">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: "#ef5350" }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Outdated Apps ({outdatedApps.length})
              </p>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {outdatedApps.map((app) => <AppRow key={app.id} app={app} />)}
          </div>
        </div>
      )}

      {/* Current apps */}
      {currentApps.length > 0 && (
        <div style={glass} className="mb-4">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" style={{ color: "#7dd94a" }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Up to Date ({currentApps.length})
              </p>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {currentApps.map((app) => <AppRow key={app.id} app={app} />)}
          </div>
        </div>
      )}

      {/* Unknown apps */}
      {unknownApps.length > 0 && (
        <div style={glass}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              Unknown Status ({unknownApps.length})
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {unknownApps.map((app) => <AppRow key={app.id} app={app} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function AppRow({ app }: { app: DeviceApp }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#f0f8ec" }}>{app.name}</p>
        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
          {app.bundle_id} · {app.version}
          {app.latest_version && app.latest_version !== app.version && (
            <span style={{ color: "#ef5350" }}> → {app.latest_version}</span>
          )}
        </p>
        {app.label && (
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>Label: {app.label}</p>
        )}
      </div>
      <div className="shrink-0 ml-3">
        <PatchStatusBadge status={app.patch_status} latestVersion={app.latest_version} />
      </div>
    </div>
  );
}
