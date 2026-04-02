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
    <div className="px-6 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#e3f2fd" }}>
          <Package className="h-5 w-5" style={{ color: "#1565c0" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Agent Enrollment</h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>Deploy the OrchardPatch agent to any Mac in minutes</p>
        </div>
      </div>

      {/* Download card */}
      <div
        className="rounded-2xl border p-6 mb-5 flex items-center justify-between"
        style={{ borderColor: "#c5e1a5", background: "linear-gradient(135deg, #f0f7e8 0%, #e8f5e9 100%)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div>
          <p className="font-bold text-base mb-0.5" style={{ color: "#1a1a2e" }}>OrchardPatch-Agent.pkg</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>macOS 12+ · Intel &amp; Apple Silicon · ~4 MB</p>
          <p className="text-xs mt-1 font-medium" style={{ color: "#4a9e1a" }}>
            ✓ Pre-configured for your organization
          </p>
        </div>
        <a
          href="https://github.com/judeglenn/orchardpatch-agent/raw/main/OrchardPatch-Agent.pkg"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 flex-shrink-0 ml-4"
          style={{ background: "#7dd94a", color: "#fff" }}
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>

      {/* Steps */}
      <div
        className="rounded-2xl border p-6 mb-5"
        style={{ borderColor: "#e2e4e7", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: "#1a1a2e" }}>How it works</h3>
        <div className="flex flex-col gap-5">
          {STEPS.map((s) => (
            <div key={s.step} className="flex gap-4">
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "#f0f7e8", color: "#2d5016" }}
              >
                {s.step}
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "#1a1a2e" }}>{s.title}</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>{s.description}</p>
                {s.code && (
                  <div className="mt-2 rounded-lg px-3 py-2 font-mono text-xs" style={{ background: "#f4f6f8", color: "#374151" }}>
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
        className="rounded-2xl border p-5"
        style={{ borderColor: "#e2e4e7", background: "#fafbfc", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="h-4 w-4" style={{ color: "#6b7280" }} />
          <p className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>Deploy via MDM</p>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
          The PKG is fully silent and MDM-compatible. Upload to Jamf Pro, Kandji, Mosyle, or any MDM as a managed package and scope it to your fleet. No user interaction required.
        </p>
      </div>
    </div>
  );
}
