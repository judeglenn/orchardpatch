import { Bell, Mail, Slack, Webhook, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    icon: <Bell className="h-5 w-5" style={{ color: "#e65100" }} />,
    title: "Version Behind Alerts",
    description: "Get notified when an app falls more than N versions behind the latest release. Set per-app thresholds to match your tolerance.",
    bg: "#fff3e0",
  },
  {
    icon: <Mail className="h-5 w-5" style={{ color: "#1565c0" }} />,
    title: "Email Digests",
    description: "Daily or weekly summary of your fleet's patch health. Delivered to your inbox so you don't have to log in to stay informed.",
    bg: "#e3f2fd",
  },
  {
    icon: <Slack className="h-5 w-5" style={{ color: "#6a1b9a" }} />,
    title: "Slack Notifications",
    description: "Push critical alerts directly into your IT Slack channel. New CVEs, apps falling behind, or patch completions — all in one place.",
    bg: "#f3e5f5",
  },
  {
    icon: <Webhook className="h-5 w-5" style={{ color: "#2d5016" }} />,
    title: "Webhook Integrations",
    description: "Send events to PagerDuty, ServiceNow, or any webhook endpoint. Plug OrchardPatch into your existing incident workflow.",
    bg: "#f0f7e8",
  },
];

export default function AlertsPage() {
  return (
    <div className="px-6 py-6 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: "#fff3e0" }}>
            🔔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Alerts</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fff3e0", color: "#e65100" }}>
                Coming Soon
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>Stay ahead of version drift and CVEs</p>
          </div>
        </div>
        <div className="rounded-xl px-5 py-4" style={{ background: "#fff3e0", border: "1px solid #ffcc80" }}>
          <p className="text-sm leading-relaxed" style={{ color: "#e65100" }}>
            Don't wait until the next inventory sync to find out your fleet is behind. Alerts proactively notifies you when something needs attention — so you can act before it becomes a problem.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border bg-white p-5" style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg mb-3" style={{ background: f.bg }}>{f.icon}</div>
            <p className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a2e" }}>{f.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{f.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border px-5 py-4 flex items-center justify-between" style={{ background: "#1a2e0d", borderColor: "#2d5016" }}>
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">Available on Pro & Enterprise</p>
          <p className="text-xs" style={{ color: "#a0c878" }}>Join the waitlist to be notified when Alerts launches.</p>
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
