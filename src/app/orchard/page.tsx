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
    <div className="px-6 py-6 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div
          className="flex items-center gap-3 mb-3 rounded-xl px-5 py-4"
          style={{ background: "#1a2e0d", border: "1px solid #2d5016" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shrink-0"
            style={{ background: "#2d5016" }}
          >
            🌳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                Cultivation
              </h1>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.1)", color: "#a0c878" }}
              >
                Coming Soon
              </span>
            </div>
            <p className="text-sm mt-0.5 text-white opacity-75">
              Policy-based auto-remediation for your entire fleet
            </p>
          </div>
        </div>

        <div
          className="rounded-xl px-5 py-4"
          style={{ background: "#f0f7e8", border: "1px solid #c5e1a5" }}
        >
          <div className="text-sm leading-relaxed space-y-1.5" style={{ color: "#2d5016" }}>
            <p><strong>Patch by the Fruit</strong> patches one app on one device.</p>
            <p><strong>Patch by the Branch</strong> patches one app across your entire fleet.</p>
            <p><strong>Patch by the Bushel</strong> patches all outdated apps on a single device.</p>
            <p><strong>Patch by the Orchard</strong> patches all outdated apps across your entire fleet.</p>
            <p><strong>Cultivation</strong> is autopilot. Define your policies once, and your fleet stays up to date automatically.</p>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border bg-white p-5"
            style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg mb-3"
              style={{ background: f.bg }}
            >
              {f.icon}
            </div>
            <p className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a2e" }}>
              {f.title}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
              {f.description}
            </p>
          </div>
        ))}
      </div>

      {/* Pricing tier callout */}
      <div
        className="rounded-xl border px-5 py-4 flex items-center justify-between"
        style={{ background: "#1a2e0d", borderColor: "#2d5016" }}
      >
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">Enterprise Tier</p>
          <p className="text-xs" style={{ color: "#a0c878" }}>
            Cultivation is part of the Enterprise plan. Join the waitlist to be notified when it launches.
          </p>
        </div>
        <a
          href="https://orchardpatch.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 shrink-0 ml-4 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
          style={{ background: "#2d5016", color: "white" }}
        >
          Join Waitlist
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
