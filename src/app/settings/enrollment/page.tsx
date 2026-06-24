"use client";

import { Download, Terminal, CheckCircle2, Package } from "lucide-react";

const STEPS = [
  {
    step: "1",
    title: "Download the Agent PKG",
    description: "The PKG is pre-configured for your organization — no manual setup required.",
  },
  {
    step: "2",
    title: "Install on any Mac",
    description: "Run the installer with admin privileges. Works silently via MDM or command line.",
    code: "sudo installer -pkg OrchardPatch-Agent.pkg -target /",
  },
  {
    step: "3",
    title: "Done — Mac appears in your fleet",
    description: "The agent starts automatically and checks in within 60 seconds. No reboot required.",
  },
];

export default function EnrollmentPage() {
  return (
    <div style={{ padding: "24px", maxWidth: "42rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
          <Package className="h-5 w-5" style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Agent Enrollment</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Deploy the OrchardPatch agent to any Mac in minutes</p>
        </div>
      </div>

      {/* Download card */}
      <div
        style={{ borderRadius: 16, padding: 24, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-accent)", boxShadow: "var(--shadow-card)" }}
      >
        <div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 2, color: "var(--text-primary)" }}>OrchardPatch-Agent.pkg</p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>macOS 12+ · Intel &amp; Apple Silicon · ~4 MB</p>
          <p style={{ fontSize: 12, marginTop: 4, fontWeight: 500, color: "var(--st-current)" }}>
            ✓ Pre-configured for your organization
          </p>
        </div>
        <a
          href="https://github.com/judeglenn/orchardpatch-agent/raw/main/OrchardPatch-Agent.pkg"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, flexShrink: 0, marginLeft: 16, background: "var(--accent)", color: "var(--page-bg)" }}
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>

      {/* Steps */}
      <div
        style={{ borderRadius: 16, padding: 24, marginBottom: 20, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text-primary)" }}>How it works</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {STEPS.map((s) => (
            <div key={s.step} style={{ display: "flex", gap: 16 }}>
              <div
                style={{ display: "flex", width: 28, height: 28, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 9999, fontSize: 12, fontWeight: 700, background: "var(--accent-tint)", color: "var(--accent)" }}
              >
                {s.step}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, color: "var(--text-primary)" }}>{s.title}</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.description}</p>
                {s.code && (
                  <div style={{ marginTop: 8, borderRadius: 8, padding: "8px 12px", fontFamily: "monospace", fontSize: 12, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}>
                    {s.code}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MDM deploy note */}
      <div
        style={{ borderRadius: 16, padding: 20, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Terminal className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Deploy via Jamf Pro</p>
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 12, color: "var(--text-secondary)" }}>
          Upload the PKG to Jamf Pro and attach the OrchardPatch enrollment script to the same policy. Set your org token as <span className="font-mono" style={{ color: "#374151" }}>Parameter 4</span> — each device enrolls automatically with no user interaction.
        </p>
        <div style={{ borderRadius: 8, padding: "8px 12px", fontFamily: "monospace", fontSize: 12, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}>
          <span style={{ color: "var(--text-tertiary)" }}>Parameter 4:</span> your-org-token<br />
          <span style={{ color: "var(--text-tertiary)" }}>Parameter 5:</span> https://orchardpatch-server-production.up.railway.app
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-tertiary)" }}>
          Compatible with Jamf Pro, Kandji, Mosyle, and any MDM that supports PKG deployment with script parameters.
        </p>
      </div>
    </div>
  );
}
