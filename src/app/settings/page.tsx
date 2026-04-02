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
  "Live": { bg: "rgba(125,217,74,0.15)", color: "#4a9e1a" },
  "In Development": { bg: "#e8f5e9", color: "#2e7d32" },
  "Planned": { bg: "#eef0f2", color: "#9ca3af" },
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
    <div className="px-6 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            Configure OrchardPatch for your organization
          </p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search settings…" className="w-64" />
      </div>

      {search && (
        <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
          {totalVisible} setting{totalVisible !== 1 ? "s" : ""} found
        </p>
      )}

      <div className="flex flex-col gap-8">
        {filtered.map((section) => (
          <div key={section.category}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: "#6b7280" }}>
              {section.category}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {section.items.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex flex-col gap-3 rounded-xl border bg-white p-5 transition-all hover:shadow-md hover:border-[#c5e1a5]"
                  style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: item.bg }}
                    >
                      {item.icon}
                    </div>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={STATUS_STYLE[item.status]}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1 group-hover:text-[#2d5016] transition-colors" style={{ color: "#1a1a2e" }}>
                      {item.title}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
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
