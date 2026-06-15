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
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(125,217,74,0.15)", color: "#9fe066", border: "1px solid rgba(125,217,74,0.25)" }}
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
    <div className="px-6 py-6 max-w-6xl">

      {/* Toast */}
      <div
        className="fixed top-5 left-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl"
        style={{
          transform: toastMsg ? "translate(-50%, 0)" : "translate(-50%, -120%)",
          transition: "transform 300ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease",
          opacity: toastMsg ? 1 : 0,
          pointerEvents: toastMsg ? "auto" : "none",
          background: "#5aaa28",
          color: "white",
          minWidth: 260,
          textAlign: "center",
        }}
      >
        {toastMsg}
      </div>

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/apps"
          className="inline-flex items-center gap-1.5 text-sm mb-4"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <ChevronLeft className="h-4 w-4" /> Back to Inventory
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-6 w-6" style={{ color: "#7dd94a" }} />
          <h1 className="text-3xl font-bold" style={{ color: "#f0f8ec" }}>
            Software Catalog
          </h1>
        </div>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          {data
            ? `${data.total.toLocaleString()} patchable app${data.total !== 1 ? "s" : ""} via Installomator`
            : "1,137 patchable apps via Installomator"}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <SourceBadge source="Installomator" />
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "rgba(255,255,255,0.35)" }}
          />
          <input
            type="text"
            placeholder="Search by app name or label..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#f0f8ec",
              outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-6 p-4 rounded-lg flex items-start gap-3"
          style={{ background: "rgba(244,67,54,0.10)", borderLeft: "3px solid #ef9a9a" }}
        >
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#ef9a9a" }} />
          <div>
            <p style={{ color: "#ef9a9a" }}>{error}</p>
            <button
              onClick={fetchCatalog}
              className="text-xs mt-2 underline"
              style={{ color: "#ef9a9a" }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#7dd94a" }} />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
          <p style={{ color: "rgba(255,255,255,0.45)" }}>
            {debouncedSearch ? `No packages matching "${debouncedSearch}"` : "No packages available"}
          </p>
          {debouncedSearch && (
            <button
              onClick={() => handleSearchChange("")}
              className="text-xs mt-3 underline"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Result count */}
          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.40)" }}>
            {debouncedSearch
              ? `${data.total.toLocaleString()} result${data.total !== 1 ? "s" : ""} for "${debouncedSearch}"`
              : `Showing ${((page - 1) * 50 + 1).toLocaleString()}–${Math.min(page * 50, data.total).toLocaleString()} of ${data.total.toLocaleString()}`}
          </p>

          {/* Table */}
          <div
            className="rounded-2xl overflow-hidden mb-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <table className="w-full">
              <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <tr style={{ background: "rgba(0,0,0,0.2)" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>
                    App Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>
                    Label
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>
                    Source
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr
                    key={item.label}
                    style={{
                      background: idx % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "#f0f8ec" }}>
                      {item.app_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.50)" }}>
                        {item.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge source="Installomator" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(item)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 active:scale-95"
                        style={{ background: "#5aaa28", color: "white" }}
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
            <div className="flex items-center justify-center gap-4 mb-6" style={{ flexWrap: "wrap" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded disabled:opacity-30 transition-opacity"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                Page {data.page} of {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="p-1.5 rounded disabled:opacity-30 transition-opacity"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 rounded text-xs"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.55)",
                  outline: "none",
                }}
              >
                <option value={25} style={{ background: "#1a2613" }}>25 / page</option>
                <option value={50} style={{ background: "#1a2613" }}>50 / page</option>
                <option value={100} style={{ background: "#1a2613" }}>100 / page</option>
              </select>
            </div>
          )}
        </>
      )}

      {/* Deploy Modal */}
      {showModal && selectedApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.60)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "#1a2613",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-start justify-between px-6 py-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div>
                <h2 className="text-base font-semibold" style={{ color: "#f0f8ec" }}>
                  Deploy {selectedApp.app_name}
                </h2>
                <p className="text-xs font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {selectedApp.label}
                </p>
              </div>
              <button onClick={closeModal} style={{ color: "rgba(255,255,255,0.40)" }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-6">

              {/* Device selector */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase mb-2"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Target Device
                </label>
                {devicesLoading ? (
                  <div className="flex items-center gap-2 py-2" style={{ color: "rgba(255,255,255,0.40)" }}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading devices...</span>
                  </div>
                ) : (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: selectedDeviceId
                        ? "1px solid rgba(125,217,74,0.5)"
                        : "1px solid rgba(255,255,255,0.15)",
                      color: selectedDeviceId ? "#f0f8ec" : "rgba(255,255,255,0.40)",
                      outline: "none",
                    }}
                  >
                    <option value="" disabled style={{ background: "#1a2613" }}>
                      Select a device...
                    </option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id} style={{ background: "#1a2613" }}>
                        {d.hostname}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Mode picker */}
              <div>
                <p
                  className="text-xs font-semibold uppercase mb-2"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Patch Mode
                </p>
                <div className="space-y-2">
                  {(["silent", "managed", "prompted"] as PatchMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all"
                      style={{
                        background: mode === m ? "rgba(125,217,74,0.10)" : "rgba(255,255,255,0.04)",
                        border: mode === m
                          ? "1px solid rgba(125,217,74,0.45)"
                          : "1px solid rgba(255,255,255,0.10)",
                        color: mode === m ? "#9fe066" : "rgba(255,255,255,0.55)",
                      }}
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
              className="flex gap-3 px-6 py-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              <button
                onClick={closeModal}
                disabled={deploying}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                disabled={!selectedDeviceId || deploying}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: !selectedDeviceId || deploying ? "rgba(90,170,40,0.35)" : "#5aaa28",
                  color: "white",
                  cursor: !selectedDeviceId || deploying ? "not-allowed" : "pointer",
                }}
              >
                {deploying ? (
                  <span className="flex items-center justify-center gap-2">
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
