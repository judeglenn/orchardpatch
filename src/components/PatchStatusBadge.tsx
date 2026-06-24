import { CheckCircle2, AlertCircle, HelpCircle, Settings, ShoppingBag } from "lucide-react";

export type PatchStatus = "current" | "outdated" | "unknown" | "na" | "mas";

interface PatchStatusBadgeProps {
  status: PatchStatus;
  latestVersion?: string | null;
  className?: string;
}

const STATUS_CONFIG = {
  current: {
    icon: CheckCircle2,
    label: "Current",
    color: "var(--st-current)",
    bg: "var(--accent-tint)",
    border: "var(--border-accent)",
  },
  outdated: {
    icon: AlertCircle,
    label: "Outdated",
    color: "var(--st-outdated)",
    bg: "color-mix(in srgb, var(--st-outdated) 12%, transparent)",
    border: "color-mix(in srgb, var(--st-outdated) 35%, transparent)",
  },
  unknown: {
    icon: HelpCircle,
    label: "Unknown",
    color: "var(--text-tertiary)",
    bg: "var(--surface-raised)",
    border: "var(--border-hairline)",
  },
  na: {
    icon: Settings,
    label: "System",
    color: "var(--text-tertiary)",
    bg: "var(--surface-raised)",
    border: "var(--border-hairline)",
  },
  mas: {
    icon: ShoppingBag,
    label: "App Store",
    color: "var(--accent)",
    bg: "var(--accent-tint)",
    border: "var(--border-accent)",
  },
};

export function PatchStatusBadge({ status, latestVersion }: PatchStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        borderRadius: 9999,
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 600,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
      }}
      title={status === "na" ? "Managed by Apple" : status === "mas" ? "Managed by App Store" : latestVersion ? `Latest: ${latestVersion}` : undefined}
    >
      <Icon style={{ width: 10, height: 10 }} />
      {cfg.label}
    </span>
  );
}

export function patchStatusEmoji(status: PatchStatus): string {
  return status === "current" ? "✅" : status === "outdated" ? "🔴" : status === "na" ? "⚪" : status === "mas" ? "🍎" : "🟡";
}
