"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Monitor, AlertTriangle, CheckCircle2, ChevronLeft, Package, Clock } from "lucide-react";
import { FLEET_SERVER_URL, FLEET_SERVER_TOKEN } from "@/lib/fleetServer";
import { formatRelativeDate } from "@/lib/utils";

interface DeviceApp {
  bundle_id: string;
  name: string;
  version: string;
  latest_version?: string;
  is_outdated: number;
  installomator_label?: string;
  path: string;
  last_seen: string;
}

interface DeviceDetail {
  id: string;
  hostname: string;
  serial?: string;
  model: string;
  os_version: string;
  ram?: string;
  cpu?: string;
  agent_version: string;
  last_seen: string;
  apps: DeviceApp[];
}

const glass = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
} as React.CSSProperties;

export default function DeviceDetailPage({ params }: { params: { id: string } }) {
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDevice() {
      try {
        const res = await fetch(`${FLEET_SERVER_URL}/devices/${params.id}`, {
          headers: { "x-orchardpatch-token": FLEET_SERVER_TOKEN },
        });
        if (!res.ok) {
          if (res.status === 404) {
            setError("Device not found");
          } else {
            setError("Failed to load device");
          }
          return;
        }
        const data = await res.json();
        setDevice(data);
      } catch (err) {
        console.error("Device fetch failed:", err);
        setError("Failed to connect to fleet server");
      } finally {
        setLoading(false);
      }
    }
    fetchDevice();
  }, [params.id]);

  const outdatedApps = device?.apps.filter(a => a.is_outdated === 1) || [];
  const upToDateApps = device?.apps.filter(a => a.is_outdated === 0) || [];

  if (loading) {
    return (
      <div className="px-6 py-6 flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-[#7dd94a] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="px-6 py-6">
        <Link href="/fleet" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: "#7dd94a" }}>
          <ChevronLeft className="h-4 w-4" />
          Back to Fleet
        </Link>
        <div style={glass} className="px-6 py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" style={{ color: "#ffb74d" }} />
          <p className="text-lg font-semibold mb-2" style={{ color: "#f0f8ec" }}>
            {error || "Device not found"}
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            The device may have been removed or never checked in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <Link href="/fleet" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: "#7dd94a" }}>
        <ChevronLeft className="h-4 w-4" />
        Back to Fleet
      </Link>

      {/* Device info card */}
      <div style={glass} className="px-6 py-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(125,217,74,0.15)", border: "1px solid rgba(125,217,74,0.25)" }}>
            <Monitor className="h-6 w-6" style={{ color: "#7dd94a" }} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#f0f8ec" }}>
              {device.hostname}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span>{device.model || "Mac"}</span>
              <span>·</span>
              <span>{device.os_version || "macOS"}</span>
              {device.serial && (
                <>
                  <span>·</span>
                  <span className="font-mono text-xs">{device.serial}</span>
                </>
              )}
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
                  style={{ background: "rgba(255,152,0,0.15)", color: "#ffb74d", border: "1px solid rgba(255,152,0,0.3)" }}>
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
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Last seen: {formatRelativeDate(device.last_seen)}
            </p>
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
              <p className="text-2xl font-bold" style={{ color: "#f0f8ec" }}>
                {device.apps.length}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Total Apps
              </p>
            </div>
          </div>
        </div>
        <div style={glass} className="px-5 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" style={{ color: "#ffb74d" }} />
            <div>
              <p className="text-2xl font-bold" style={{ color: "#ffb74d" }}>
                {outdatedApps.length}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Outdated
              </p>
            </div>
          </div>
        </div>
        <div style={glass} className="px-5 py-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5" style={{ color: "rgba(255,255,255,0.55)" }} />
            <div>
              <p className="text-lg font-bold" style={{ color: "#f0f8ec" }}>
                {formatRelativeDate(device.last_seen)}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Last Check-in
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Apps list */}
      {outdatedApps.length > 0 && (
        <div style={glass} className="mb-4">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: "#ffb74d" }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Outdated Apps ({outdatedApps.length})
              </p>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {outdatedApps.map((app, idx) => (
              <AppRow key={`outdated-${idx}`} app={app} />
            ))}
          </div>
        </div>
      )}

      <div style={glass}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" style={{ color: "#7dd94a" }} />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              Up to Date Apps ({upToDateApps.length})
            </p>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {upToDateApps.map((app, idx) => (
            <AppRow key={`uptodate-${idx}`} app={app} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppRow({ app }: { app: DeviceApp }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#f0f8ec" }}>
          {app.name}
        </p>
        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
          {app.bundle_id} · {app.version}
          {app.latest_version && app.latest_version !== app.version && (
            <span style={{ color: "#ffb74d" }}> → {app.latest_version}</span>
          )}
        </p>
        {app.installomator_label && (
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
            Label: {app.installomator_label}
          </p>
        )}
      </div>
      {app.is_outdated === 1 && (
        <span className="shrink-0 ml-3 text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: "rgba(255,152,0,0.15)", color: "#ffb74d" }}>
          Outdated
        </span>
      )}
    </div>
  );
}
