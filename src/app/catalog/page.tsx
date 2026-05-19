"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Package,
} from "lucide-react";

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

export default function CatalogPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<CatalogItem | null>(null);
  const [deployMode, setDeployMode] = useState<"silent" | "managed" | "prompted">("managed");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [allDevices, setAllDevices] = useState<{ id: string; hostname: string }[]>([]);
  const [deployLoading, setDeployLoading] = useState(false);

  const limit = 50;

  // Fetch catalog
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/catalog?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load catalog");
        return;
      }

      setData(data);
    } catch (err) {
      setError("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  // Fetch devices for deploy modal
  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const result = await res.json();
      setAllDevices(result.devices || []);
    } catch {
      setAllDevices([]);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDeploy = (app: CatalogItem) => {
    setSelectedApp(app);
    setSelectedDevices([]);
    setShowDeployModal(true);
    fetchDevices();
  };

  const handleConfirmDeploy = async () => {
    if (!selectedApp || selectedDevices.length === 0) return;

    setDeployLoading(true);
    try {
      if (selectedDevices.length === 1) {
        // Fruit: single device
        const res = await fetch("/api/patch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bundleId: selectedApp.bundle_id || selectedApp.label,
            label: selectedApp.label,
            appName: selectedApp.app_name,
            mode: deployMode,
            deviceId: selectedDevices[0],
          }),
        });

        if (!res.ok) {
          alert(`Failed: ${(await res.json()).error}`);
          return;
        }

        setShowDeployModal(false);
        router.push("/patches?method=fruit");
      } else {
        // Bushel: multiple devices
        const res = await fetch("/api/patch-jobs/bushel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: selectedApp.label,
            mode: deployMode,
          }),
        });

        if (!res.ok) {
          alert(`Failed: ${(await res.json()).error}`);
          return;
        }

        setShowDeployModal(false);
        router.push("/patches?method=bushel");
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDeployLoading(false);
    }
  };

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId) ? prev.filter((d) => d !== deviceId) : [...prev, deviceId]
    );
  };

  const selectAllDevices = () => {
    if (selectedDevices.length === allDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(allDevices.map((d) => d.id));
    }
  };

  return (
    <div className="px-6 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/apps" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
          <ChevronLeft className="h-4 w-4" /> Back to Inventory
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-6 w-6" style={{ color: "#7dd94a" }} />
          <h1 className="text-3xl font-bold" style={{ color: "#f0f8ec" }}>
            Software Catalog
          </h1>
        </div>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Browse and deploy from {data?.total || 0} available packages
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: "rgba(125,217,74,0.12)", color: "#9fe066" }}
          >
            Installomator
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4" style={{ color: "rgba(255,255,255,0.35)" }} />
          <input
            type="text"
            placeholder="Search by app name or label..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#f0f8ec",
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-6 p-4 rounded-lg flex items-start gap-3"
          style={{ background: "rgba(244,67,54,0.12)", borderLeft: "3px solid #ef9a9a" }}
        >
          <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: "#ef9a9a" }} />
          <div>
            <p style={{ color: "#ef9a9a" }}>{error}</p>
            <button
              onClick={() => fetchCatalog()}
              className="text-xs mt-2 underline"
              style={{ color: "#ef9a9a" }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#7dd94a" }} />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p style={{ color: "rgba(255,255,255,0.45)" }}>
            {search ? `No packages matching "${search}"` : "No packages available"}
          </p>
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="text-xs mt-3 underline"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div
            className="rounded-2xl overflow-hidden mb-6"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <table className="w-full">
              <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <tr style={{ background: "rgba(0,0,0,0.2)" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
                    App Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Label
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Team ID
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
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
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: "#f0f8ec" }}>
                      {item.app_name}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {item.label}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {item.expected_team || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeploy(item)}
                        className="text-xs font-semibold px-3 py-1.5 rounded transition-all hover:opacity-80 active:scale-95"
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
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span style={{ color: "rgba(255,255,255,0.55)" }} className="text-sm">
                Page {data.page} of {data.pages}
              </span>
              <button
                onClick={() => setPage(Math.min(data.pages, page + 1))}
                disabled={page === data.pages}
                className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Deploy Modal */}
      {showDeployModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-2xl w-full max-w-lg max-h-96 flex flex-col"
            style={{
              background: "rgba(12,22,8,0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {/* Header */}
            <div
              className="px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h2 className="text-lg font-bold mb-1" style={{ color: "#f0f8ec" }}>
                Deploy {selectedApp.app_name}
              </h2>
              <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
                {selectedApp.label}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Devices */}
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Select Devices
                </p>
                <button
                  onClick={selectAllDevices}
                  className="text-xs mb-2 underline"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {selectedDevices.length === allDevices.length ? "Deselect All" : "Select All"}
                </button>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {allDevices.map((device) => (
                    <label key={device.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(device.id)}
                        onChange={() => toggleDevice(device.id)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: "#f0f8ec" }}>
                        {device.hostname}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mode */}
              <div>
                <p className="text-xs font-semibold uppercase mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Patch Mode
                </p>
                <div className="space-y-2">
                  {(["silent", "managed", "prompted"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDeployMode(mode)}
                      className="w-full text-left px-3 py-2 rounded text-sm transition-all"
                      style={{
                        background: deployMode === mode ? "rgba(125,217,74,0.12)" : "rgba(255,255,255,0.04)",
                        border:
                          deployMode === mode
                            ? "1px solid rgba(125,217,74,0.5)"
                            : "1px solid rgba(255,255,255,0.12)",
                        color: deployMode === mode ? "#9fe066" : "rgba(255,255,255,0.55)",
                      }}
                    >
                      <div className="font-semibold capitalize">{mode}</div>
                      <div className="text-xs mt-0.5">
                        {mode === "silent" && "Force quit, no prompts"}
                        {mode === "managed" && "Notify, must comply"}
                        {mode === "prompted" && "User chooses when. If already closed, installs silently."}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex gap-3 px-6 py-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              <button
                onClick={() => setShowDeployModal(false)}
                disabled={deployLoading}
                className="flex-1 px-4 py-2 rounded text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeploy}
                disabled={selectedDevices.length === 0 || deployLoading}
                className="flex-1 px-4 py-2 rounded text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: selectedDevices.length === 0 ? "rgba(125,217,74,0.3)" : "#5aaa28",
                  color: "white",
                  cursor: selectedDevices.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {deployLoading ? "Deploying..." : `Deploy ${deployMode === "silent" ? "Silent" : deployMode === "managed" ? "Managed" : "Prompted"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
