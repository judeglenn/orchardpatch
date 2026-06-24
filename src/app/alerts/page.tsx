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
    <div style={{ padding: "24px", maxWidth: "48rem" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, fontSize: 24, background: "var(--accent-tint)" }}>
            🔔
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Alerts</h1>
              <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: "color-mix(in srgb, var(--st-outdated) 15%, transparent)", color: "var(--st-outdated)" }}>
                Coming Soon
              </span>
            </div>
            <p style={{ fontSize: 14, marginTop: 2, color: "var(--text-secondary)" }}>Stay ahead of version drift and CVEs</p>
          </div>
        </div>
        <div style={{ borderRadius: 12, padding: "16px 20px", background: "color-mix(in srgb, var(--st-outdated) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--st-outdated) 25%, transparent)" }}>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--st-outdated)" }}>
            Don't wait until the next inventory sync to find out your fleet is behind. Alerts proactively notifies you when something needs attention — so you can act before it becomes a problem.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
        {FEATURES.map((f) => (
          <div key={f.title} style={{ borderRadius: 12, padding: 20, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8, marginBottom: 12, background: f.bg }}>{f.icon}</div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>{f.title}</p>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>{f.description}</p>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", border: "1px solid var(--border-hairline)" }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>Available on Pro & Enterprise</p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Join the waitlist to be notified when Alerts launches.</p>
        </div>
        <a href="https://orchardpatch.com" target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 16, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, background: "var(--accent)", color: "var(--page-bg)" }}>
          Join Waitlist <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
