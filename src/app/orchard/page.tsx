"use client";

import { TreeDeciduous, Zap, Clock, ShieldCheck, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    icon: <Zap className="h-5 w-5" style={{ color: "#2d5016" }} />,
    title: "Auto-remediation Rules",
    description:
      'Set it and forget it. Define rules like "always keep Chrome within 1 version of latest" and OrchardPatch handles the rest - no manual trigger required.',
    bg: "#f0f7e8",
  },
  {
    icon: <Clock className="h-5 w-5" style={{ color: "#1565c0" }} />,
    title: "Scheduled Patch Windows",
    description:
      "Define maintenance windows per app or per device group. Patches run overnight, on login, or during off-hours - never interrupting your team mid-meeting.",
    bg: "#e3f2fd",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" style={{ color: "#6a1b9a" }} />,
    title: "Compliance Enforcement",
    description:
      "Flag devices that fall outside policy automatically. Get audit-ready reports showing patch status, version drift, and remediation history across your fleet.",
    bg: "#f3e5f5",
  },
  {
    icon: <TreeDeciduous className="h-5 w-5" style={{ color: "#e65100" }} />,
    title: "Per-App Policy Overrides",
    description:
      "Global defaults with per-app overrides. Handle Zoom and Slack differently than background utilities. Block patches during business hours for critical apps.",
    bg: "#fff3e0",
  },
];

export default function OrchardPage() {
  return (
    <div style={{ padding: "24px", maxWidth: "48rem" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, borderRadius: 12, padding: "16px 20px", backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", border: "1px solid var(--border-hairline)" }}
        >
          <div
            style={{ display: "flex", width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, fontSize: 24, flexShrink: 0, background: "var(--accent-tint)" }}
          >
            🌳
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                Cultivation
              </h1>
              <span
                style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: "var(--surface-raised)", color: "var(--text-secondary)" }}
              >
                Coming Soon
              </span>
            </div>
            <p style={{ fontSize: 14, marginTop: 2, color: "var(--text-secondary)" }}>
              Policy-based auto-remediation for your entire fleet
            </p>
          </div>
        </div>

        <div
          style={{ borderRadius: 12, padding: "16px 20px", background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}
        >
          <div style={{ fontSize: 14, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 6, color: "var(--text-primary)" }}>
            <p><strong>Patch by the Fruit</strong> patches one app on one device.</p>
            <p><strong>Patch by the Branch</strong> patches all outdated apps on a single device.</p>
            <p><strong>Patch by the Bushel</strong> patches one app across your entire fleet.</p>
            <p><strong>Patch by the Orchard</strong> patches all outdated apps across your entire fleet.</p>
            <p><strong>Cultivation</strong> is autopilot. Define your policies once, and your fleet stays up to date automatically.</p>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{ borderRadius: 12, padding: 20, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
          >
            <div
              style={{ display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8, marginBottom: 12, background: f.bg }}
            >
              {f.icon}
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>
              {f.title}
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>
              {f.description}
            </p>
          </div>
        ))}
      </div>

      {/* Pricing tier callout */}
      <div
        style={{ borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", border: "1px solid var(--border-hairline)" }}
      >
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>Enterprise Tier</p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Cultivation is part of the Enterprise plan. Join the waitlist to be notified when it launches.
          </p>
        </div>
        <a
          href="https://orchardpatch.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 16, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, background: "var(--accent)", color: "var(--page-bg)" }}
        >
          Join Waitlist
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
