import { Link2, Shield, Webhook, GitBranch, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    icon: <Link2 className="h-5 w-5" style={{ color: "#2d5016" }} />,
    title: "Jamf Pro",
    description: "Pull real device inventory and app data directly from your Jamf Pro instance. No agents, no CSV uploads — live data from your MDM.",
    bg: "#f0f7e8",
    status: "In Development",
  },
  {
    icon: <Shield className="h-5 w-5" style={{ color: "#1565c0" }} />,
    title: "Microsoft Intune",
    description: "Support for Intune-enrolled macOS devices. Bring cross-platform fleet visibility into a single pane of glass.",
    bg: "#e3f2fd",
    status: "Planned",
  },
  {
    icon: <Webhook className="h-5 w-5" style={{ color: "#6a1b9a" }} />,
    title: "Outbound Webhooks",
    description: "Send patch events, alerts, and inventory changes to any endpoint. Works with Zapier, Make, ServiceNow, PagerDuty, and more.",
    bg: "#f3e5f5",
    status: "Planned",
  },
  {
    icon: <GitBranch className="h-5 w-5" style={{ color: "#e65100" }} />,
    title: "API Access",
    description: "Full REST API for building your own integrations. Query inventory, trigger patches, and subscribe to events programmatically.",
    bg: "#fff3e0",
    status: "Planned",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="px-6 py-6 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: "#f0f7e8" }}>
            🔗
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Integrations</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fff3e0", color: "#e65100" }}>
                Coming Soon
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>Connect OrchardPatch to your existing stack</p>
          </div>
        </div>
        <div className="rounded-xl px-5 py-4" style={{ background: "#f0f7e8", border: "1px solid #c5e1a5" }}>
          <p className="text-sm leading-relaxed" style={{ color: "#2d5016" }}>
            OrchardPatch is designed to augment your MDM, not replace it. Integrations connect your existing tools so data flows automatically — no manual syncs, no duplicate work.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border bg-white p-5" style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: f.bg }}>{f.icon}</div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: f.status === "In Development" ? "#e8f5e9" : "#eef0f2", color: f.status === "In Development" ? "#2e7d32" : "#9ca3af" }}>
                {f.status}
              </span>
            </div>
            <p className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a2e" }}>{f.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{f.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border px-5 py-4 flex items-center justify-between" style={{ background: "#1a2e0d", borderColor: "#2d5016" }}>
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">Available on all paid plans</p>
          <p className="text-xs" style={{ color: "#a0c878" }}>Join the waitlist and tell us which integration you need most.</p>
        </div>
        <a href="https://orchardpatch.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 shrink-0 ml-4 rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ background: "#2d5016", color: "white" }}>
          Join Waitlist <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
