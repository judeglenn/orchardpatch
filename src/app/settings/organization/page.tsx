"use client";

import { useState } from "react";
import { Building2, Copy, Check, Download, RefreshCw } from "lucide-react";

const ORG = {
  name: "Queer Mountaineers",
  customerId: "org_qm_2026_demo",
  enrollmentToken: "orchardpatch-fleet-2026",
  serverUrl: "https://orchardpatch-server-production.up.railway.app",
  plan: "Early Access",
  devices: 2,
  maxDevices: 25,
  createdAt: "April 1, 2026",
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
        {label}
      </p>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 8, border: "1px solid var(--border-hairline)", padding: "10px 12px", fontFamily: "monospace", fontSize: 14, background: "var(--surface-raised)", color: "var(--text-primary)" }}
      >
        <span className="truncate">{value}</span>
        <button
          onClick={copy}
          style={{ marginLeft: 12, flexShrink: 0, borderRadius: 4, padding: 4, cursor: "pointer" }}
          title="Copy"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" style={{ color: "var(--st-current)" }} />
          ) : (
            <Copy className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
          )}
        </button>
      </div>
    </div>
  );
}

export default function OrganizationPage() {
  return (
    <div style={{ padding: "24px", maxWidth: "42rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, background: "var(--accent-tint)" }}>
          <Building2 className="h-5 w-5" style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Organization Profile</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Your org details and enrollment credentials</p>
        </div>
      </div>

      {/* Org card */}
      <div
        style={{ borderRadius: 16, padding: 24, marginBottom: 20, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{ORG.name}</h2>
            <span
              style={{ display: "inline-block", marginTop: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: "var(--accent-tint)", color: "var(--accent)" }}
            >
              {ORG.plan}
            </span>
          </div>
          <div className="text-right">
            <p style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>{ORG.devices}</p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>of {ORG.maxDevices} devices</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CopyField label="Customer ID" value={ORG.customerId} />
          <CopyField label="Enrollment Token" value={ORG.enrollmentToken} />
          <CopyField label="Fleet Server URL" value={ORG.serverUrl} />
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-tertiary)" }}>
          Organization created {ORG.createdAt}
        </p>
      </div>

      {/* Enrollment instructions */}
      <div
        style={{ borderRadius: 16, padding: 24, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>Enroll a Mac</h3>
        <p style={{ fontSize: 12, marginBottom: 16, color: "var(--text-secondary)" }}>
          The agent PKG is pre-configured for your organization. Install it on any Mac and it will appear in your fleet within minutes.
        </p>

        <div style={{ borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 12, marginBottom: 16, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}>
          sudo installer -pkg OrchardPatch-Agent.pkg -target /
        </div>

        <a
          href="/settings/enrollment"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, background: "var(--accent)", color: "var(--page-bg)" }}
        >
          <Download className="h-4 w-4" />
          Download Agent PKG
        </a>
      </div>
    </div>
  );
}
