import { Link2, Shield, Webhook, GitBranch, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    icon: <Link2 className="h-5 w-5" style={{ color: "var(--accent)" }} />,
    title: "Jamf Pro",
    description: "Pull real device inventory and app data directly from your Jamf Pro instance. No agents, no CSV uploads — live data from your MDM.",
    bg: "var(--accent-tint)",
    statusLabel: "In Development",
    statusBg: "color-mix(in srgb, var(--st-current) 12%, transparent)",
    statusColor: "var(--st-current)",
  },
  {
    icon: <Shield className="h-5 w-5" style={{ color: "var(--text-secondary)" }} />,
    title: "Microsoft Intune",
    description: "Support for Intune-enrolled macOS devices. Bring cross-platform fleet visibility into a single pane of glass.",
    bg: "var(--surface-raised)",
    statusLabel: "Planned",
    statusBg: "var(--surface-raised)",
    statusColor: "var(--text-tertiary)",
  },
  {
    icon: <Webhook className="h-5 w-5" style={{ color: "var(--text-secondary)" }} />,
    title: "Outbound Webhooks",
    description: "Send patch events, alerts, and inventory changes to any endpoint. Works with Zapier, Make, ServiceNow, PagerDuty, and more.",
    bg: "var(--surface-raised)",
    statusLabel: "Planned",
    statusBg: "var(--surface-raised)",
    statusColor: "var(--text-tertiary)",
  },
  {
    icon: <GitBranch className="h-5 w-5" style={{ color: "var(--text-secondary)" }} />,
    title: "API Access",
    description: "Full REST API for building your own integrations. Query inventory, trigger patches, and subscribe to events programmatically.",
    bg: "var(--surface-raised)",
    statusLabel: "Planned",
    statusBg: "var(--surface-raised)",
    statusColor: "var(--text-tertiary)",
  },
];

export default function IntegrationsPage() {
  return (
    <div style={{ padding: "24px", maxWidth: 768 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              width: 48,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              fontSize: 24,
              background: "var(--accent-tint)",
              border: "1px solid var(--border-accent)",
            }}
          >
            🔗
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Integrations</h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 9999,
                  background: "color-mix(in srgb, var(--st-outdated) 12%, transparent)",
                  color: "var(--st-outdated)",
                  border: "1px solid color-mix(in srgb, var(--st-outdated) 30%, transparent)",
                }}
              >
                Coming Soon
              </span>
            </div>
            <p style={{ fontSize: 14, marginTop: 2, color: "var(--text-secondary)" }}>Connect OrchardPatch to your existing stack</p>
          </div>
        </div>
        <div
          style={{
            borderRadius: 12,
            padding: "16px 20px",
            background: "var(--accent-tint)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
            OrchardPatch is designed to augment your MDM, not replace it. Integrations connect your existing tools so data flows automatically — no manual syncs, no duplicate work.
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              borderRadius: 12,
              padding: 20,
              background: "var(--surface-glass)",
              backgroundImage: "var(--sheen)",
              backdropFilter: "blur(20px) saturate(150%)",
              WebkitBackdropFilter: "blur(20px) saturate(150%)",
              border: "1px solid var(--border-hairline)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  width: 36,
                  height: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  background: f.bg,
                  border: "1px solid var(--border-hairline)",
                }}
              >
                {f.icon}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: 9999,
                  background: f.statusBg,
                  color: f.statusColor,
                  border: "1px solid var(--border-hairline)",
                }}
              >
                {f.statusLabel}
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>{f.title}</p>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-tertiary)" }}>{f.description}</p>
          </div>
        ))}
      </div>

      {/* CTA banner */}
      <div
        style={{
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface-glass)",
          backgroundImage: "var(--sheen)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          border: "1px solid var(--border-accent)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, color: "var(--text-primary)" }}>Available on all paid plans</p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Join the waitlist and tell us which integration you need most.</p>
        </div>
        <a
          href="https://orchardpatch.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            marginLeft: 16,
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 600,
            background: "var(--accent)",
            color: "var(--page-bg)",
            textDecoration: "none",
          }}
        >
          Join Waitlist <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
