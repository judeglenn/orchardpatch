"use client";

import { use, useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { PatchStatusBadge, type PatchStatus } from "@/components/PatchStatusBadge";
import { formatDate, formatRelativeDate, appInitials, appColorClass, macOSName } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { ChevronLeft, Cpu, HardDrive, Clock, Package, Zap, BellOff, Bell, MessageSquare, X, AlertTriangle, RefreshCw, Settings } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FleetApp {
  id: number;
  device_id: string;
  bundle_id: string;
  name: string;
  version: string;
  latest_version: string | null;
  last_checked: string | null;
  cache_age_seconds: number | null;
  label: string | null;
  patch_status: PatchStatus;
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

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  position: "relative",
  backgroundColor: "var(--surface-glass)",
  backgroundImage: "var(--sheen)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  backdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid var(--border-hairline)",
  borderRadius: "var(--r-xl)",
  boxShadow: "var(--shadow-card)",
  transition: "background-color 0.5s, box-shadow 0.5s",
};

const modalStyle: React.CSSProperties = {
  backgroundColor: "var(--surface-solid)",
  border: "1px solid var(--border-hairline)",
  borderRadius: "var(--r-xl)",
  boxShadow: "var(--shadow-card)",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeviceDetailPage({ params }: Props) {
  const { id } = use(params);

  const [device, setDevice] = useState<FleetDevice | null>(null);
  const [apps, setApps] = useState<FleetApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"outdated" | null>(null);
  const [patchTarget, setPatchTarget] = useState<{ bundleId: string; label: string | null; appName: string } | null>(null);
  const [patchMode, setPatchMode] = useState<"silent" | "managed" | "prompted">("managed");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [patching, setPatching] = useState(false);

  // Branch modal state
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchChecked, setBranchChecked] = useState<Set<string>>(new Set());
  const [branchMode, setBranchMode] = useState<"silent" | "managed" | "prompted">("managed");
  const [branchQueuing, setBranchQueuing] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  // Force check-in state
  const [forceCheckinLoading, setForceCheckinLoading] = useState(false);
  const [forceCheckinStatus, setForceCheckinStatus] = useState<"idle" | "success" | "error">("idle");

  const outdatedLabeledApps = useMemo(
    () => apps.filter((a) => a.patch_status === "outdated" && a.label),
    [apps]
  );

  function openBranchModal() {
    setBranchChecked(new Set(outdatedLabeledApps.map((a) => a.label!)));
    setBranchMode("managed");
    setBranchError(null);
    setBranchModalOpen(true);
  }

  function toggleBranchApp(label: string) {
    setBranchChecked((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  async function handleBranchPatch() {
    if (!device || branchChecked.size === 0) return;
    setBranchQueuing(true);
    setBranchError(null);
    try {
      const res = await fetch(`/api/patch-jobs/branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: device.id, labels: Array.from(branchChecked), mode: branchMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server returned ${res.status}`);
      setBranchModalOpen(false);
      router.push(`/patches?device_id=${encodeURIComponent(device.id)}`);
    } catch (err: any) {
      setBranchError(err.message ?? "Failed to queue patches");
    } finally {
      setBranchQueuing(false);
    }
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function handleForceCheckin() {
    if (!device || forceCheckinLoading) return;
    setForceCheckinLoading(true);
    setForceCheckinStatus("idle");
    try {
      const res = await fetch("/api/force-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }
      setForceCheckinStatus("success");
      setTimeout(() => setForceCheckinStatus("idle"), 3000);
    } catch {
      setForceCheckinStatus("error");
      setTimeout(() => setForceCheckinStatus("idle"), 3000);
    } finally {
      setForceCheckinLoading(false);
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [deviceRes, appsRes] = await Promise.all([
        fetch(`/api/fleet/devices/${encodeURIComponent(id)}`),
        fetch(`/api/apps/status?device_id=${encodeURIComponent(id)}`),
      ]);
      if (!deviceRes.ok) {
        if (deviceRes.status === 404) throw new Error("Device not found");
        throw new Error(`Failed to load device (${deviceRes.status})`);
      }
      if (!appsRes.ok) throw new Error(`Failed to load app status (${appsRes.status})`);
      const deviceData = await deviceRes.json();
      const appsData = await appsRes.json();
      setDevice(deviceData);
      setApps(appsData.apps ?? []);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Derived state ──────────────────────────────────────────────────────────

  const filteredApps = useMemo(() => {
    let result = apps.filter((a) => a.patch_status !== "na");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q) || a.version.toLowerCase().includes(q));
    }
    if (statusFilter) result = result.filter((a) => a.patch_status === statusFilter);
    return result;
  }, [apps, search, statusFilter]);

  const systemApps = useMemo(
    () => apps.filter((a) => a.patch_status === "na").sort((a, b) => a.name.localeCompare(b.name)),
    [apps]
  );
  const naCount = systemApps.length;
  const outdatedCount = useMemo(() => apps.filter((a) => a.patch_status === "outdated").length, [apps]);
  const currentCount = useMemo(() => apps.filter((a) => a.patch_status === "current").length, [apps]);

  // ─── Patch handler ──────────────────────────────────────────────────────────

  async function handlePatchNow() {
    if (!patchTarget || !device) return;
    if (!patchTarget.label) {
      showToast("No Installomator label — can't patch this app");
      setPatchTarget(null);
      return;
    }
    setPatching(true);
    try {
      const res = await fetch(`/api/patch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.id, bundleId: patchTarget.bundleId, label: patchTarget.label, appName: patchTarget.appName, mode: patchMode }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      showToast(`${patchTarget.appName} queued for patching`);
    } catch (err: any) {
      showToast(`Failed to queue patch: ${err.message}`);
    } finally {
      setPatching(false);
      setPatchTarget(null);
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-secondary)", textDecoration: "none" }}>
            <ChevronLeft className="h-4 w-4" /> App Inventory
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "96px 0" }}>
          <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--text-tertiary)" }} />
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────

  if (error || !device) {
    return (
      <div style={{ padding: "24px" }}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-secondary)", textDecoration: "none" }}>
            <ChevronLeft className="h-4 w-4" /> App Inventory
          </Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 0", gap: 16 }}>
          <AlertTriangle className="h-10 w-10" style={{ color: "var(--st-lagging)" }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{error ?? "Device Not Found"}</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Could not load device <code style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{id}</code> from Fleet Server.
          </p>
          <button
            onClick={loadData}
            style={{ marginTop: 8, padding: "8px 16px", borderRadius: "var(--r-md)", background: "var(--accent)", color: "var(--page-bg)", fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "24px 28px 48px" }}>

      {/* Back link */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-secondary)", textDecoration: "none" }}>
          <ChevronLeft className="h-4 w-4" />
          App Inventory
        </Link>
      </div>

      {/* Device header card */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20, padding: "22px 24px", marginBottom: 18 }}>
        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--accent-tint)",
          border: "1px solid var(--border-accent)",
        }}>
          <Cpu className="h-7 w-7" style={{ color: "var(--accent)" }} />
        </div>

        {/* Info */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)", marginBottom: 4, color: "var(--text-primary)" }}>
            {device.hostname}
          </h1>
          <p style={{ fontSize: 14, marginBottom: 8, color: "var(--text-secondary)" }}>
            {device.model ?? "Unknown model"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, fontSize: 14, color: "var(--text-secondary)" }}>
            {device.os_version && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <HardDrive className="h-3.5 w-3.5" />
                macOS {macOSName(device.os_version) ? `${macOSName(device.os_version)} ` : ""}{device.os_version}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Package className="h-3.5 w-3.5" />
              <strong style={{ color: "var(--text-primary)" }}>{apps.length - naCount}</strong>&nbsp;apps installed
              {naCount > 0 && <span style={{ color: "var(--text-tertiary)" }}>&nbsp;· {naCount} system</span>}
            </span>
            {outdatedCount > 0 && (
              <button
                onClick={() => setStatusFilter((f) => f === "outdated" ? null : "outdated")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontWeight: 600, fontSize: 14, cursor: "pointer",
                  color: "var(--st-outdated)",
                  border: statusFilter === "outdated" ? "1px solid var(--border-accent)" : "1px solid transparent",
                  background: statusFilter === "outdated" ? "var(--accent-tint)" : "transparent",
                  borderRadius: "var(--r-sm)", padding: "2px 6px",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--st-outdated)", display: "inline-block", flexShrink: 0 }} />
                {outdatedCount} outdated
              </button>
            )}
            {outdatedCount === 0 && currentCount > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: "var(--st-current)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--st-current)", display: "inline-block" }} />
                All Known Apps Up to Date
              </span>
            )}
            {device.last_seen && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock className="h-3.5 w-3.5" />
                Last Seen{" "}
                <strong style={{ color: "var(--text-primary)" }}>{formatRelativeDate(device.last_seen)}</strong>
                &nbsp;
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>({formatDate(device.last_seen)})</span>
              </span>
            )}
          </div>

          {/* Force check-in row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <button
              onClick={handleForceCheckin}
              disabled={forceCheckinLoading}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--border-hairline)",
                background: "var(--surface-raised)",
                color: "var(--text-primary)",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                opacity: forceCheckinLoading ? 0.5 : 1,
              }}
            >
              <RefreshCw className={"h-3 w-3" + (forceCheckinLoading ? " animate-spin" : "")} />
              {forceCheckinLoading ? "Checking In..." : "Force Check-In"}
            </button>
            {forceCheckinStatus === "success" && (
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--st-current)" }}>Check-In Queued</span>
            )}
            {forceCheckinStatus === "error" && (
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--st-lagging)" }}>Failed — Try Again</span>
            )}
            {forceCheckinStatus === "idle" && (
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Results Appear Within 60 Seconds</span>
            )}
          </div>
        </div>
      </div>

      {/* Apps table card */}
      <div style={{ ...cardStyle, marginBottom: 18, padding: 0 }}>
        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border-hairline)", flexWrap: "wrap" as const }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
              Apps Detected
            </p>
            <p style={{ fontSize: 12, marginTop: 2, color: "var(--text-tertiary)" }}>
              {filteredApps.length === apps.length - naCount
                ? `${apps.length - naCount} installed`
                : `${filteredApps.length} of ${apps.length - naCount} installed`}
              {outdatedCount > 0 && (
                <button
                  onClick={() => setStatusFilter((f) => f === "outdated" ? null : "outdated")}
                  style={{ marginLeft: 4, cursor: "pointer", background: "none", border: "none", padding: 0, fontSize: 12, color: statusFilter === "outdated" ? "var(--st-outdated)" : "var(--text-tertiary)" }}
                >
                  · {outdatedCount} outdated{statusFilter === "outdated" ? " ×" : ""}
                </button>
              )}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flex: 1 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Filter Apps…" style={{ width: 200 }} />
            <button
              onClick={() => {
                if (outdatedLabeledApps.length === 0) {
                  showToast(outdatedCount === 0 ? "All Apps Are Up to Date!" : "No Patchable Outdated Apps (None Have Installomator Labels)");
                } else {
                  openBranchModal();
                }
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "7px 14px",
                borderRadius: "var(--r-md)",
                background: "var(--accent-grad)",
                border: "1px solid rgba(255,255,255,0.22)",
                color: "#fff",
                fontSize: 12, fontWeight: 600,
                cursor: "pointer",
                boxShadow: "var(--shadow-accent)",
                flexShrink: 0,
              }}
            >
              <Zap className="h-3.5 w-3.5" />
              Patch All Outdated
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", padding: "0 12px" }}>
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: "var(--border-hairline)", background: "var(--surface-raised)" }}>
                {["App Name", "Installed", "Latest", "Status", "Patch"].map((h, i) => (
                  <TableHead
                    key={h}
                    style={{
                      fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
                      color: "var(--text-secondary)",
                      textAlign: i === 4 ? "right" : "left",
                      display: (i === 1 || i === 2) ? undefined : undefined,
                    }}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.length > 0 ? (
                filteredApps.map((app, idx) => {
                  const initials = appInitials(app.name);
                  const colorClass = appColorClass(app.name);
                  const isOutdated = app.patch_status === "outdated";
                  return (
                    <TableRow
                      key={app.id}
                      style={{
                        background: idx % 2 === 1 ? "var(--surface-raised)" : "transparent",
                        borderColor: "var(--border-hairline)",
                      }}
                    >
                      {/* App name */}
                      <TableCell>
                        <Link
                          href={`/apps/${app.bundle_id?.replace(/\./g, "-").toLowerCase() ?? app.id}`}
                          style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}
                        >
                          <div
                            className={colorClass}
                            style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 700 }}
                          >
                            {initials}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{app.name}</span>
                        </Link>
                      </TableCell>

                      {/* Installed version */}
                      <TableCell>
                        <span style={{
                          fontFamily: "var(--mono)", fontSize: 12, padding: "2px 8px", borderRadius: 4,
                          ...(isOutdated
                            ? { background: "color-mix(in srgb, var(--st-outdated) 12%, transparent)", color: "var(--st-outdated)", border: "1px solid color-mix(in srgb, var(--st-outdated) 30%, transparent)" }
                            : { color: "var(--text-secondary)" })
                        }}>
                          {app.version}
                        </span>
                      </TableCell>

                      {/* Latest version */}
                      <TableCell>
                        {app.latest_version ? (
                          <span style={{ fontFamily: "var(--mono)", fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "var(--accent-tint)", color: "var(--st-current)", border: "1px solid var(--border-accent)" }}>
                            {app.latest_version}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <PatchStatusBadge status={app.patch_status} latestVersion={app.latest_version} />
                      </TableCell>

                      {/* Patch action */}
                      <TableCell style={{ textAlign: "right", overflow: "visible" }}>
                        {isOutdated ? (
                          <button
                            onClick={() => setPatchTarget({ bundleId: app.bundle_id, label: app.label, appName: app.name })}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "5px 12px",
                              borderRadius: "var(--r-pill)",
                              background: "var(--accent-grad)",
                              border: "1px solid rgba(255,255,255,0.22)",
                              color: "#fff",
                              fontSize: 11, fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Patch
                          </button>
                        ) : (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "5px 12px",
                            borderRadius: "var(--r-pill)",
                            background: "var(--surface-raised)",
                            color: "var(--text-tertiary)",
                            fontSize: 11, fontWeight: 600,
                          }}>
                            Up to date
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: "center", padding: "48px 0", fontSize: 14, color: "var(--text-tertiary)" }}>
                    {statusFilter
                      ? <>No {statusFilter} apps match your search.{" "}
                          <button onClick={() => setStatusFilter(null)} style={{ textDecoration: "underline", cursor: "pointer", background: "none", border: "none", fontSize: 14, color: "var(--accent)" }}>
                            Clear Filter
                          </button>
                        </>
                      : "No Apps Match Your Search"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* System Apps collapsible */}
      {systemApps.length > 0 && (
        <details style={{ marginTop: 16, borderRadius: "var(--r-xl)", overflow: "hidden", background: "var(--surface-glass)", border: "1px solid var(--border-hairline)" }}>
          <summary style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-tertiary)", listStyle: "none" }}>
            <Settings className="h-3 w-3" />
            System Apps ({systemApps.length})
          </summary>
          <div style={{ borderTop: "1px solid var(--border-hairline)" }}>
            <Table>
              <TableBody>
                {systemApps.map((app, idx) => (
                  <TableRow
                    key={app.id}
                    style={{
                      background: idx % 2 === 1 ? "var(--surface-raised)" : "transparent",
                      borderColor: "var(--border-hairline)",
                    }}
                  >
                    <TableCell>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          className={appColorClass(app.name)}
                          style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 700 }}
                        >
                          {appInitials(app.name)}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-tertiary)" }}>{app.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-tertiary)" }}>{app.version}</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>—</span>
                    </TableCell>
                    <TableCell>
                      <PatchStatusBadge status="na" />
                    </TableCell>
                    <TableCell style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>—</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      )}

      {/* Branch (Patch This Device) modal */}
      {branchModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !branchQueuing) setBranchModalOpen(false); }}
        >
          <div style={{ ...modalStyle, width: "100%", maxWidth: 480, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-hairline)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>Patch Device</h2>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)" }}>{device.hostname}</p>
                <p style={{ fontSize: 12, marginTop: 2, color: "var(--text-tertiary)" }}>
                  {branchChecked.size} App{branchChecked.size !== 1 ? "s" : ""} Selected
                </p>
              </div>
              <button onClick={() => { if (!branchQueuing) setBranchModalOpen(false); }} style={{ color: "var(--text-tertiary)", cursor: "pointer", background: "none", border: "none", padding: 4 }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* App list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
              {outdatedLabeledApps.length === 0 ? (
                <p style={{ fontSize: 14, padding: "16px 0", textAlign: "center", color: "var(--text-tertiary)" }}>No Patchable Outdated Apps.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {outdatedLabeledApps.map((app) => {
                    const checked = branchChecked.has(app.label!);
                    return (
                      <button
                        key={app.label}
                        onClick={() => toggleBranchApp(app.label!)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 12px",
                          borderRadius: "var(--r-md)",
                          border: checked ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
                          background: checked ? "var(--accent-tint)" : "var(--surface-raised)",
                          cursor: "pointer", textAlign: "left", width: "100%",
                        }}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: checked ? "1.5px solid var(--accent)" : "1.5px solid var(--border-hairline)",
                          background: checked ? "var(--accent)" : "transparent",
                        }}>
                          {checked && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.name}</p>
                          <p style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-tertiary)" }}>
                            {app.version} <span style={{ color: "var(--text-tertiary)" }}>→</span> {app.latest_version ?? "?"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mode selector */}
            <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border-hairline)" }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, color: "var(--text-tertiary)" }}>Deployment Mode</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {([
                  { key: "silent" as const, icon: <BellOff className="h-3.5 w-3.5" />, label: "Silent", sub: "Force Quit, No Prompts", recommended: false },
                  { key: "managed" as const, icon: <Bell className="h-3.5 w-3.5" />, label: "Managed", sub: "Notifies User to Quit", recommended: true },
                  { key: "prompted" as const, icon: <MessageSquare className="h-3.5 w-3.5" />, label: "User Prompted", sub: "User Chooses When", recommended: false },
                ] as const).map(({ key, icon, label, sub, recommended }) => {
                  const active = branchMode === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setBranchMode(key)}
                      style={{
                        position: "relative",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        padding: "10px 8px",
                        borderRadius: "var(--r-md)", textAlign: "center", cursor: "pointer",
                        border: active ? "1.5px solid var(--border-accent)" : "1px solid var(--border-hairline)",
                        background: active ? "var(--accent-tint)" : "var(--surface-raised)",
                      }}
                    >
                      {recommended && (
                        <span style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 9999, background: "var(--accent)", color: "#fff", whiteSpace: "nowrap" }}>Recommended</span>
                      )}
                      <span style={{ color: active ? "var(--accent)" : "var(--text-tertiary)" }}>{icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>{label}</span>
                      <span style={{ fontSize: 9, lineHeight: 1.3, color: "var(--text-tertiary)" }}>{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {branchError && (
              <div style={{ margin: "0 24px 8px", padding: "8px 12px", borderRadius: "var(--r-md)", fontSize: 12, background: "color-mix(in srgb, var(--st-lagging) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--st-lagging) 30%, transparent)", color: "var(--st-lagging)" }}>
                {branchError}
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-hairline)" }}>
              <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setBranchModalOpen(false)}
                disabled={branchQueuing}
                style={{ flex: 1, padding: "10px", borderRadius: "var(--r-md)", border: "1px solid var(--border-hairline)", background: "var(--surface-raised)", color: "var(--text-primary)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleBranchPatch}
                disabled={branchQueuing || branchChecked.size === 0}
                style={{
                  flex: 1, padding: "10px",
                  borderRadius: "var(--r-md)",
                  background: branchChecked.size === 0 ? "var(--surface-raised)" : "var(--accent-grad)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: branchChecked.size === 0 ? "var(--text-tertiary)" : "#fff",
                  fontSize: 13, fontWeight: 600,
                  cursor: branchQueuing || branchChecked.size === 0 ? "not-allowed" : "pointer",
                  opacity: branchQueuing ? 0.7 : 1,
                  boxShadow: branchChecked.size > 0 ? "var(--shadow-accent)" : "none",
                }}
              >
                {branchQueuing ? "Queuing…" : `Patch ${branchChecked.size} App${branchChecked.size !== 1 ? "s" : ""}`}
              </button>
              </div>
              <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8, letterSpacing: "0.02em" }}>Patch by the Branch · All Outdated Apps, Single Device</div>
            </div>
          </div>
        </div>
      )}

      {/* Fruit (single app) patch modal */}
      {patchTarget && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setPatchTarget(null); }}
        >
          <div style={{ ...modalStyle, width: "100%", maxWidth: 400 }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-hairline)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>Patch {patchTarget.appName}</h2>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)" }}>{patchTarget.appName}</p>
                <p style={{ fontSize: 12, marginTop: 2, color: "var(--text-tertiary)" }}>on {device.hostname}</p>
              </div>
              <button onClick={() => setPatchTarget(null)} style={{ color: "var(--text-tertiary)", cursor: "pointer", background: "none", border: "none", padding: 4 }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div style={{ padding: "16px 24px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, color: "var(--text-tertiary)" }}>Patch Mode</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { key: "silent" as const, icon: <BellOff className="h-3.5 w-3.5" />, label: "Silent", sub: "Force Quit, No Prompts" },
                  { key: "managed" as const, icon: <Bell className="h-3.5 w-3.5" />, label: "Managed", sub: "Notify, Must Comply", recommended: true },
                  { key: "prompted" as const, icon: <MessageSquare className="h-3.5 w-3.5" />, label: "User Prompted", sub: "User Chooses When" },
                ].map(({ key, icon, label, sub, recommended }) => (
                  <button
                    key={key}
                    onClick={() => setPatchMode(key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px",
                      borderRadius: "var(--r-md)", cursor: "pointer", textAlign: "left",
                      border: patchMode === key ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
                      background: patchMode === key ? "var(--accent-tint)" : "var(--surface-raised)",
                    }}
                  >
                    <span style={{ color: patchMode === key ? "var(--accent)" : "var(--text-tertiary)" }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
                        {recommended && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", padding: "1px 6px", borderRadius: 9999, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>recommended</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-hairline)" }}>
              <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setPatchTarget(null)}
                disabled={patching}
                style={{ flex: 1, padding: "10px", borderRadius: "var(--r-md)", border: "1px solid var(--border-hairline)", background: "var(--surface-raised)", color: "var(--text-primary)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handlePatchNow}
                disabled={patching}
                style={{
                  flex: 1, padding: "10px",
                  borderRadius: "var(--r-md)",
                  background: "var(--accent-grad)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "#fff",
                  fontSize: 13, fontWeight: 600,
                  cursor: patching ? "wait" : "pointer",
                  opacity: patching ? 0.7 : 1,
                  boxShadow: "var(--shadow-accent)",
                }}
              >
                {patching ? "Queuing…" : "Patch Now"}
              </button>
              </div>
              <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8, letterSpacing: "0.02em" }}>Patch by the Fruit · Single App, Single Device</div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{
        position: "fixed", top: 16, right: 16, zIndex: 60,
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 16px",
        borderRadius: "var(--r-md)",
        fontSize: 13, fontWeight: 500, color: "#fff",
        background: "var(--accent)",
        boxShadow: "var(--shadow-accent)",
        transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        opacity: toastMsg ? 1 : 0,
        transform: toastMsg ? "translateY(0)" : "translateY(-120%)",
        pointerEvents: toastMsg ? "auto" : "none",
      }}>
        {toastMsg}
      </div>
    </div>
  );
}
