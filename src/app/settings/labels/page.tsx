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

  const glass: React.CSSProperties = { backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", borderRadius: "16px", boxShadow: "var(--shadow-card)" };

  return (
    <div style={{ padding: "24px", maxWidth: "48rem" }}>
      {/* Back */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-secondary)" }}>
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>Label Overrides</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Map bundle IDs to specific Installomator labels. Overrides take priority over auto-detection.
          Useful for apps like Microsoft Teams where multiple versions use different labels.
        </p>
      </div>

      {/* Agent status */}
      {!agentOnline && !loading && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, background: "color-mix(in srgb, var(--st-outdated) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--st-outdated) 30%, transparent)" }}>
          <AlertTriangle className="h-4 w-4" style={{ color: "var(--st-outdated)" }} />
          <span style={{ fontSize: 14, color: "var(--st-outdated)" }}>Agent offline — changes will not be saved until agent is running</span>
        </div>
      )}

      {/* Add new override */}
      <div style={{ ...glass, marginBottom: 24, padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, color: "var(--text-secondary)" }}>Add Override</p>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            value={newBundleId}
            onChange={e => setNewBundleId(e.target.value)}
            placeholder="com.microsoft.teams2"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 12, fontSize: 14, outline: "none", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
          />
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="microsoftteams2"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 12, fontSize: 14, outline: "none", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
            onKeyDown={e => e.key === "Enter" && addOverride()}
          />
          <button
            onClick={addOverride}
            disabled={saving || !newBundleId.trim() || !newLabel.trim()}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", background: "var(--accent)", color: "var(--page-bg)" }}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        <p style={{ fontSize: 12, marginTop: 12, color: "var(--text-tertiary)" }}>
          Bundle ID: the app's identifier (e.g. <code style={{ color: "var(--accent)" }}>com.microsoft.teams2</code>) · Label: the Installomator label (e.g. <code style={{ color: "var(--accent)" }}>microsoftteams2</code>)
        </p>
      </div>

      {/* Existing overrides */}
      <div style={glass}>
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-hairline)" }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
            Current Overrides {overrides.length > 0 && `(${overrides.length})`}
          </p>
          <button onClick={fetchOverrides} style={{ padding: 6, borderRadius: 8, cursor: "pointer", color: "var(--text-tertiary)" }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: 24, height: 24, borderRadius: 9999, border: "2px solid var(--accent)", borderTopColor: "transparent" }} className="animate-spin" />
          </div>
        ) : overrides.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>No overrides yet</p>
            <p style={{ fontSize: 12, marginTop: 4, color: "var(--text-tertiary)" }}>Auto-detection handles most apps. Add overrides for edge cases.</p>
          </div>
        ) : (
          <div>
            {overrides.map(({ bundleId, label }) => (
              <div key={bundleId} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderTop: "1px solid var(--border-hairline)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>{bundleId}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>→</span>
                  <span style={{ fontSize: 14, fontFamily: "monospace", padding: "2px 8px", borderRadius: 4, background: "var(--accent-tint)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}>
                    {label}
                  </span>
                </div>
                <button
                  onClick={() => deleteOverride(bundleId)}
                  style={{ padding: 6, borderRadius: 8, cursor: "pointer", color: "var(--text-tertiary)" }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Common overrides reference */}
      <div style={{ ...glass, marginTop: 24, padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, color: "var(--text-secondary)" }}>Common Overrides Reference</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, fontSize: 12, fontFamily: "monospace", color: "var(--text-secondary)" }}>
          {[
            ["com.microsoft.teams2", "microsoftteams2"],
            ["com.microsoft.teams", "microsoftteams"],
            ["us.zoom.xos", "zoom"],
            ["com.tinyspeck.slackmacgap", "slack"],
            ["org.mozilla.firefox", "firefoxpkg"],
            ["com.google.Chrome", "googlechromepkg"],
          ].map(([bid, label]) => (
            <div key={bid} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => { setNewBundleId(bid); setNewLabel(label); }}>
              <span style={{ color: "var(--text-tertiary)" }}>{bid}</span>
              <span style={{ color: "var(--text-tertiary)" }}>→</span>
              <span style={{ color: "var(--accent)" }}>{label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, marginTop: 12, color: "var(--text-tertiary)" }}>
          Click any row to pre-fill the form above. Full label list available at{" "}
          <a href="https://github.com/Installomator/Installomator/blob/main/Labels.txt" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
            Installomator/Labels.txt
          </a>
        </p>
      </div>

      {/* Toast */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50, padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500, color: "var(--page-bg)", background: "var(--accent)", transition: "opacity 300ms, transform 300ms cubic-bezier(0.34,1.56,0.64,1)", opacity: toast ? 1 : 0, transform: toast ? "translateY(0)" : "translateY(-120%)", pointerEvents: toast ? "auto" : "none" }}>
        {toast}
      </div>
    </div>
  );
}
