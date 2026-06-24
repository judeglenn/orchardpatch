"use client";

import { useState } from "react";
import { Link2, Bell, Shield, RefreshCw, Database, Key, Sliders, Webhook, Users, FileText, Tag, Building2, CreditCard, Download } from "lucide-react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

const SETTINGS = [
  {
    category: "Organization",
    items: [
      {
        icon: <Building2 className="h-5 w-5" style={{ color: "#2d5016" }} />,
        bg: "#f0f7e8",
        title: "Organization Profile",
        description: "Your org name, customer ID, and enrollment token. Share with your team to onboard new devices.",
        href: "/settings/organization",
        status: "Live",
      },
      {
        icon: <Download className="h-5 w-5" style={{ color: "#1565c0" }} />,
        bg: "#e3f2fd",
        title: "Agent Enrollment",
        description: "Download the OrchardPatch Agent PKG pre-configured for your organization. Install on any Mac to enroll it.",
        href: "/settings/enrollment",
        status: "Live",
      },
      {
        icon: <CreditCard className="h-5 w-5" style={{ color: "#6a1b9a" }} />,
        bg: "#f3e5f5",
        title: "Billing & Plan",
        description: "Manage your subscription, view usage, and update payment details.",
        href: "/settings/billing",
        status: "Planned",
      },
    ],
  },
  {
    category: "Connections",
    items: [
      {
        icon: <Link2 className="h-5 w-5" style={{ color: "#2d5016" }} />,
        bg: "#f0f7e8",
        title: "Jamf Pro",
        description: "Connect your Jamf Pro instance to pull live device inventory and app data.",
        href: "/settings/jamf",
        status: "In Development",
      },
      {
        icon: <Database className="h-5 w-5" style={{ color: "#1565c0" }} />,
        bg: "#e3f2fd",
        title: "MDM Integrations",
        description: "Connect additional MDM providers — Intune, Kandji, Mosyle, and more.",
        href: "/settings/mdm",
        status: "Planned",
      },
      {
        icon: <Webhook className="h-5 w-5" style={{ color: "#6a1b9a" }} />,
        bg: "#f3e5f5",
        title: "Webhooks",
        description: "Send patch events and alerts to any external endpoint or automation platform.",
        href: "/settings/webhooks",
        status: "Planned",
      },
      {
        icon: <Key className="h-5 w-5" style={{ color: "#e65100" }} />,
        bg: "#fff3e0",
        title: "API Keys",
        description: "Generate and manage API keys for programmatic access to OrchardPatch.",
        href: "/settings/api-keys",
        status: "Planned",
      },
    ],
  },
  {
    category: "Patching",
    items: [
      {
        icon: <Tag className="h-5 w-5" style={{ color: "#7dd94a" }} />,
        bg: "rgba(125,217,74,0.12)",
        title: "Label Overrides",
        description: "Map bundle IDs to specific Installomator labels. Override auto-detection for apps like Microsoft Teams.",
        href: "/settings/labels",
        status: "Live",
      },
      {
        icon: <Sliders className="h-5 w-5" style={{ color: "#2d5016" }} />,
        bg: "#f0f7e8",
        title: "Default Patch Behavior",
        description: "Set your global default patch mode — Silent, Managed, or User Prompted.",
        href: "/settings/patch-defaults",
        status: "Planned",
      },
      {
        icon: <RefreshCw className="h-5 w-5" style={{ color: "#1565c0" }} />,
        bg: "#e3f2fd",
        title: "Inventory Sync",
        description: "Configure how often OrchardPatch pulls fresh inventory from your MDM.",
        href: "/settings/sync",
        status: "Planned",
      },
    ],
  },
  {
    category: "Notifications",
    items: [
      {
        icon: <Bell className="h-5 w-5" style={{ color: "#e65100" }} />,
        bg: "#fff3e0",
        title: "Alert Preferences",
        description: "Choose which events trigger notifications and how you want to receive them.",
        href: "/settings/alerts",
        status: "Planned",
      },
      {
        icon: <Webhook className="h-5 w-5" style={{ color: "#6a1b9a" }} />,
        bg: "#f3e5f5",
        title: "Slack",
        description: "Push patch alerts and digest summaries directly into your Slack workspace.",
        href: "/settings/slack",
        status: "Planned",
      },
    ],
  },
  {
    category: "Administration",
    items: [
      {
        icon: <Users className="h-5 w-5" style={{ color: "#2d5016" }} />,
        bg: "#f0f7e8",
        title: "Users & Permissions",
        description: "Manage who on your team can view inventory, trigger patches, or edit policies.",
        href: "/settings/users",
        status: "Planned",
      },
      {
        icon: <Shield className="h-5 w-5" style={{ color: "#1565c0" }} />,
        bg: "#e3f2fd",
        title: "Security",
        description: "Configure SSO, 2FA requirements, and session management for your organization.",
        href: "/settings/security",
        status: "Planned",
      },
      {
        icon: <FileText className="h-5 w-5" style={{ color: "#6a1b9a" }} />,
        bg: "#f3e5f5",
        title: "Audit Log",
        description: "Full history of every action taken in OrchardPatch — who did what and when.",
        href: "/settings/audit",
        status: "Planned",
      },
    ],
  },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  "Live": { bg: "var(--accent-tint)", color: "var(--accent)" },
  "In Development": { bg: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--st-current)" },
  "Planned": { bg: "var(--surface-raised)", color: "var(--text-tertiary)" },
};

export default function SettingsPage() {
  const [search, setSearch] = useState("");

  const filtered = SETTINGS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((section) => section.items.length > 0);

  const totalVisible = filtered.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div style={{ padding: "24px", maxWidth: "56rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Settings</h1>
          <p style={{ fontSize: 14, marginTop: 2, color: "var(--text-secondary)" }}>
            Configure OrchardPatch for your organization
          </p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search settings…" className="w-64" />
      </div>

      {search && (
        <p style={{ fontSize: 12, marginBottom: 16, color: "var(--text-tertiary)" }}>
          {totalVisible} setting{totalVisible !== 1 ? "s" : ""} found
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {filtered.map((section) => (
          <div key={section.category}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, color: "var(--text-tertiary)" }}>
              {section.category}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {section.items.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  style={{ display: "flex", flexDirection: "column", gap: 12, borderRadius: 12, padding: 20, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)", transition: "border-color 0.15s" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8, background: item.bg }}>
                      {item.icon}
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 9999, ...STATUS_STYLE[item.status] }}>
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
