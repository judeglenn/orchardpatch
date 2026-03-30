"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { AGENT_URL } from "@/lib/agent";

interface Override {
  bundleId: string;
  label: string;
}

export default function LabelOverridesPage() {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentOnline, setAgentOnline] = useState(false);
  const [newBundleId, setNewBundleId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchOverrides() {
    setLoading(true);
    try {
      const res = await fetch(`${AGENT_URL}/overrides`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOverrides(data.overrides || []);
      setAgentOnline(true);
    } catch {
      setAgentOnline(false);
    } finally {
      setLoading(false);
    }
  }

  async function addOverride() {
    if (!newBundleId.trim() || !newLabel.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${AGENT_URL}/overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleId: newBundleId.trim(), label: newLabel.trim() }),
      });
      if (!res.ok) throw new Error();
      setNewBundleId("");
      setNewLabel("");
      showToast("✅ Override saved");
      fetchOverrides();
    } catch {
      showToast("❌ Failed to save — is agent running?");
    } finally {
      setSaving(false);
    }
  }

  async function deleteOverride(bundleId: string) {
    try {
      await fetch(`${AGENT_URL}/overrides/${encodeURIComponent(bundleId)}`, { method: "DELETE" });
      showToast("🗑️ Override removed");
      fetchOverrides();
    } catch {
      showToast("❌ Failed to delete");
    }
  }

  useEffect(() => { fetchOverrides(); }, []);

  const glass = {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  } as React.CSSProperties;

  return (
    <div className="px-6 py-6 max-w-3xl">
      {/* Back */}
      <div className="mb-5">
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "#f0f8ec" }}>Label Overrides</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Map bundle IDs to specific Installomator labels. Overrides take priority over auto-detection.
          Useful for apps like Microsoft Teams where multiple versions use different labels.
        </p>
      </div>

      {/* Agent status */}
      {!agentOnline && !loading && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "rgba(255,160,0,0.1)", border: "1px solid rgba(255,160,0,0.3)" }}>
          <AlertTriangle className="h-4 w-4" style={{ color: "#ffb74d" }} />
          <span className="text-sm" style={{ color: "#ffb74d" }}>Agent offline — changes will not be saved until agent is running</span>
        </div>
      )}

      {/* Add new override */}
      <div className="mb-6 p-5" style={glass}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Add Override</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={newBundleId}
            onChange={e => setNewBundleId(e.target.value)}
            placeholder="com.microsoft.teams2"
            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#f0f8ec" }}
          />
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="microsoftteams2"
            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#f0f8ec" }}
            onKeyDown={e => e.key === "Enter" && addOverride()}
          />
          <button
            onClick={addOverride}
            disabled={saving || !newBundleId.trim() || !newLabel.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "#5aaa28", color: "white" }}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
          Bundle ID: the app's identifier (e.g. <code style={{ color: "#7dd94a" }}>com.microsoft.teams2</code>) · Label: the Installomator label (e.g. <code style={{ color: "#7dd94a" }}>microsoftteams2</code>)
        </p>
      </div>

      {/* Existing overrides */}
      <div style={glass}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
            Current Overrides {overrides.length > 0 && `(${overrides.length})`}
          </p>
          <button onClick={fetchOverrides} className="p-1.5 rounded-lg transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-[#7dd94a] border-t-transparent animate-spin" />
          </div>
        ) : overrides.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No overrides yet</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Auto-detection handles most apps. Add overrides for edge cases.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {overrides.map(({ bundleId, label }) => (
              <div key={bundleId} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate" style={{ color: "#f0f8ec" }}>{bundleId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>→</span>
                  <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: "rgba(125,217,74,0.12)", color: "#7dd94a", border: "1px solid rgba(125,217,74,0.25)" }}>
                    {label}
                  </span>
                </div>
                <button
                  onClick={() => deleteOverride(bundleId)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Common overrides reference */}
      <div className="mt-6 p-5" style={{ ...glass, background: "rgba(125,217,74,0.04)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Common Overrides Reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
          {[
            ["com.microsoft.teams2", "microsoftteams2"],
            ["com.microsoft.teams", "microsoftteams"],
            ["us.zoom.xos", "zoom"],
            ["com.tinyspeck.slackmacgap", "slack"],
            ["org.mozilla.firefox", "firefoxpkg"],
            ["com.google.Chrome", "googlechromepkg"],
          ].map(([bid, label]) => (
            <div key={bid} className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => { setNewBundleId(bid); setNewLabel(label); }}>
              <span style={{ color: "rgba(255,255,255,0.35)" }}>{bid}</span>
              <span style={{ color: "rgba(255,255,255,0.25)" }}>→</span>
              <span style={{ color: "#7dd94a" }}>{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>
          Click any row to pre-fill the form above. Full label list available at{" "}
          <a href="https://github.com/Installomator/Installomator/blob/main/Labels.txt" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(125,217,74,0.7)" }} className="hover:underline">
            Installomator/Labels.txt
          </a>
        </p>
      </div>

      {/* Toast */}
      <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
        style={{ background: "#2d5016", transition: "opacity 300ms, transform 300ms cubic-bezier(0.34,1.56,0.64,1)", opacity: toast ? 1 : 0, transform: toast ? "translateY(0)" : "translateY(-120%)", pointerEvents: toast ? "auto" : "none" }}>
        {toast}
      </div>
    </div>
  );
}
