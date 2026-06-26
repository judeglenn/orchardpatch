"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Package,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CatalogItem = {
  label: string;
  app_name: string;
  bundle_id: string | null;
  expected_team: string | null;
  has_conflict?: boolean;
};

type CatalogResponse = {
  items: CatalogItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type Device = {
  id: string;
  hostname: string;
};

type PatchMode = "silent" | "managed" | "prompted";

const MODE_META: Record<PatchMode, { label: string; description: string }> = {
  silent:   { label: "Silent",  description: "Force quit blocking processes, no prompts" },
  managed:  { label: "Managed", description: "Notify user, must comply" },
  prompted: { label: "Prompted", description: "User chooses when. If already closed, installs silently." },
};

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: string }) {
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: "var(--accent-tint)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}
    >
      {source}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const router = useRouter();

  // Catalog state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3500);
  }

  // Deploy modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<CatalogItem | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [mode, setMode] = useState<PatchMode>("silent");
  const [deploying, setDeploying] = useState(false);

  // ── Debounced search ────────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  // ── Fetch catalog ───────────────────────────────────────────────────────────
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());

      const res = await fetch(`/api/catalog?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load catalog");
        return;
      }
      setData(json);
    } catch {
      setError("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // ── Fetch devices for modal ─────────────────────────────────────────────────
  const fetchDevices = useCallback(async () => {
    setDevicesLoading(true);
    try {
      const res = await fetch("/api/devices");
      const json = await res.json();
      setDevices(json.devices || []);
    } catch {
      setDevices([]);
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  // ── Open / close modal ──────────────────────────────────────────────────────
  function openModal(item: CatalogItem) {
    setSelectedApp(item);
    setSelectedDeviceId("");
    setMode("silent");
    setShowModal(true);
    fetchDevices();
  }

  function closeModal() {
    setShowModal(false);
    setSelectedApp(null);
    setSelectedDeviceId("");
  }

  // ── Deploy ──────────────────────────────────────────────────────────────────
  async function handleDeploy() {
    if (!selectedApp || !selectedDeviceId) return;
    setDeploying(true);
    try {
      const res = await fetch("/api/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: selectedApp.label,
          appName: selectedApp.app_name,
          deviceId: selectedDeviceId,
          mode,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        showToast(`❌ ${json.error || "Deploy failed"}`);
        return;
      }

      closeModal();
      showToast(`✅ Patch queued for ${selectedApp.app_name} — redirecting...`);
      setTimeout(() => {
        router.push(`/patches?method=fruit&label=${encodeURIComponent(selectedApp.label)}`);
      }, 800);
    } catch {
      showToast("❌ Server error — could not queue patch");
    } finally {
      setDeploying(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px", maxWidth: "72rem" }}>

      {/* Toast */}
      <div
        className="fixed top-5 left-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl"
        style={{
          transform: toastMsg ? "translate(-50%, 0)" : "translate(-50%, -120%)",
          transition: "transform 300ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease",
          opacity: toastMsg ? 1 : 0,
          pointerEvents: toastMsg ? "auto" : "none",
          background: "var(--accent)",
          color: "white",
          minWidth: 260,
          textAlign: "center",
        }}
      >
        {toastMsg}
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/apps"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, marginBottom: 16, color: "var(--text-secondary)" }}
        >
          <ChevronLeft className="h-4 w-4" /> Back to Inventory
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Package className="h-6 w-6" style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--text-primary)" }}>
            Software Catalog
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {data
            ? `${data.total.toLocaleString()} patchable app${data.total !== 1 ? "s" : ""} via Installomator`
            : "1,137 patchable apps via Installomator"}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <SourceBadge source="Installomator" />
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: "relative" }}>
          <Search
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            placeholder="Search by app name or label..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderRadius: 8, fontSize: 14, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", outline: "none" }}
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{ marginBottom: 24, padding: 16, borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 12, background: "color-mix(in srgb, var(--st-lagging) 10%, transparent)", borderLeft: "3px solid var(--st-lagging)" }}
        >
          <AlertCircle style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0, color: "var(--st-lagging)" }} />
          <div>
            <p style={{ color: "var(--st-lagging)" }}>{error}</p>
            <button
              onClick={fetchCatalog}
              style={{ fontSize: 12, marginTop: 8, textDecoration: "underline", color: "var(--st-lagging)" }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Package style={{ width: 48, height: 48, margin: "0 auto 12px", color: "var(--text-tertiary)" }} />
          <p style={{ color: "var(--text-secondary)" }}>
            {debouncedSearch ? `No packages matching "${debouncedSearch}"` : "No packages available"}
          </p>
          {debouncedSearch && (
            <button
              onClick={() => handleSearchChange("")}
              style={{ fontSize: 12, marginTop: 12, textDecoration: "underline", color: "var(--text-tertiary)" }}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Result count */}
          <p style={{ fontSize: 12, marginBottom: 12, color: "var(--text-tertiary)" }}>
            {debouncedSearch
              ? `${data.total.toLocaleString()} result${data.total !== 1 ? "s" : ""} for "${debouncedSearch}"`
              : `Showing ${((page - 1) * 50 + 1).toLocaleString()}–${Math.min(page * 50, data.total).toLocaleString()} of ${data.total.toLocaleString()}`}
          </p>

          {/* Table */}
          <div
            style={{ borderRadius: 16, overflow: "hidden", marginBottom: 24, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
          >
            <table className="w-full">
              <thead style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                <tr style={{ background: "color-mix(in srgb, var(--page-bg) 40%, transparent)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
                    App Name
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
                    Label
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
                    Source
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr
                    key={item.label}
                    style={{
                      background: idx % 2 === 1 ? "color-mix(in srgb, var(--surface-glass) 50%, transparent)" : "transparent",
                      borderBottom: "1px solid var(--border-hairline)",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                      {item.app_name}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                        {item.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <SourceBadge source="Installomator" />
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={item.has_conflict ? undefined : () => openModal(item)}
                        disabled={!!item.has_conflict}
                        title={item.has_conflict ? "Identity conflict -- this label is unsafe to deploy" : "Deploy to device"}
                        style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: item.has_conflict ? "not-allowed" : "pointer", background: "var(--accent)", color: "white", opacity: item.has_conflict ? 0.4 : 1, pointerEvents: item.has_conflict ? "none" : "auto" }}
                      >
                        Deploy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" as const }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: 6, borderRadius: 6, cursor: "pointer", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Page {data.page} of {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                style={{ padding: 6, borderRadius: 6, cursor: "pointer", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", outline: "none" }}
              >
                <option value={25} style={{ background: "var(--surface-glass)" }}>25 / page</option>
                <option value={50} style={{ background: "var(--surface-glass)" }}>50 / page</option>
                <option value={100} style={{ background: "var(--surface-glass)" }}>100 / page</option>
              </select>
            </div>
          )}
        </>
      )}

      {/* Deploy Modal */}
      {showModal && selectedApp && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.60)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{ width: "100%", maxWidth: 448, borderRadius: 16, overflow: "hidden", backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
          >
            {/* Modal header */}
            <div
              style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border-hairline)" }}
            >
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                  Deploy {selectedApp.app_name}
                </h2>
                <p style={{ fontSize: 12, fontFamily: "monospace", marginTop: 2, color: "var(--text-tertiary)" }}>
                  {selectedApp.label}
                </p>
              </div>
              <button onClick={closeModal} style={{ color: "var(--text-tertiary)" }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Device selector */}
              <div>
                <label
                  style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, color: "var(--text-secondary)" }}
                >
                  Target Device
                </label>
                {devicesLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", color: "var(--text-tertiary)" }}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span style={{ fontSize: 14 }}>Loading devices...</span>
                  </div>
                ) : (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 14, background: "var(--surface-raised)", border: selectedDeviceId ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", color: selectedDeviceId ? "var(--text-primary)" : "var(--text-tertiary)", outline: "none" }}
                  >
                    <option value="" disabled style={{ background: "var(--surface-glass)" }}>
                      Select a device...
                    </option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id} style={{ background: "var(--surface-glass)" }}>
                        {d.hostname}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Mode picker */}
              <div>
                <p
                  style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, color: "var(--text-secondary)" }}
                >
                  Patch Mode
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(["silent", "managed", "prompted"] as PatchMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, fontSize: 14, cursor: "pointer", background: mode === m ? "var(--accent-tint)" : "var(--surface-raised)", border: mode === m ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", color: mode === m ? "var(--accent)" : "var(--text-secondary)" }}
                    >
                      <div className="font-semibold">{MODE_META[m].label}</div>
                      <div className="text-xs mt-0.5 opacity-80">{MODE_META[m].description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div
              style={{ display: "flex", gap: 12, padding: "16px 24px", borderTop: "1px solid var(--border-hairline)" }}
            >
              <button
                onClick={closeModal}
                disabled={deploying}
                style={{ flex: 1, padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                disabled={!selectedDeviceId || deploying}
                style={{ flex: 1, padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: !selectedDeviceId || deploying ? "color-mix(in srgb, var(--accent) 35%, transparent)" : "var(--accent)", color: "white", cursor: !selectedDeviceId || deploying ? "not-allowed" : "pointer" }}
              >
                {deploying ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deploying...
                  </span>
                ) : (
                  `Deploy ${MODE_META[mode].label}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
