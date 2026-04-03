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
      <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#6b7280" }}>
        {label}
      </p>
      <div
        className="flex items-center justify-between rounded-lg border px-3 py-2.5 font-mono text-sm"
        style={{ borderColor: "#e2e4e7", background: "#f9fafb", color: "#1a1a2e" }}
      >
        <span className="truncate">{value}</span>
        <button
          onClick={copy}
          className="ml-3 flex-shrink-0 rounded p-1 transition-colors hover:bg-gray-200"
          title="Copy"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" style={{ color: "#4a9e1a" }} />
          ) : (
            <Copy className="h-3.5 w-3.5" style={{ color: "#9ca3af" }} />
          )}
        </button>
      </div>
    </div>
  );
}

export default function OrganizationPage() {
  return (
    <div className="px-6 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#f0f7e8" }}>
          <Building2 className="h-5 w-5" style={{ color: "#2d5016" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Organization Profile</h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>Your org details and enrollment credentials</p>
        </div>
      </div>

      {/* Org card */}
      <div
        className="rounded-2xl border p-6 mb-5"
        style={{ borderColor: "#e2e4e7", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#1a1a2e" }}>{ORG.name}</h2>
            <span
              className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(125,217,74,0.15)", color: "#4a9e1a" }}
            >
              {ORG.plan}
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: "#1a1a2e" }}>{ORG.devices}</p>
            <p className="text-xs" style={{ color: "#9ca3af" }}>of {ORG.maxDevices} devices</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <CopyField label="Customer ID" value={ORG.customerId} />
          <CopyField label="Enrollment Token" value={ORG.enrollmentToken} />
          <CopyField label="Fleet Server URL" value={ORG.serverUrl} />
        </div>

        <p className="mt-4 text-xs" style={{ color: "#9ca3af" }}>
          Organization created {ORG.createdAt}
        </p>
      </div>

      {/* Enrollment instructions */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "#e2e4e7", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <h3 className="text-sm font-semibold mb-1" style={{ color: "#1a1a2e" }}>Enroll a Mac</h3>
        <p className="text-xs mb-4" style={{ color: "#6b7280" }}>
          The agent PKG is pre-configured for your organization. Install it on any Mac and it will appear in your fleet within minutes.
        </p>

        <div className="rounded-lg p-3 font-mono text-xs mb-4" style={{ background: "#f4f6f8", color: "#374151" }}>
          sudo installer -pkg OrchardPatch-Agent.pkg -target /
        </div>

        <a
          href="/settings/enrollment"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "#7dd94a", color: "#fff" }}
        >
          <Download className="h-4 w-4" />
          Download Agent PKG
        </a>
      </div>
    </div>
  );
}
