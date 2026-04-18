import { CheckCircle2, AlertCircle, HelpCircle, Settings } from "lucide-react";

export type PatchStatus = "current" | "outdated" | "unknown" | "na";

interface PatchStatusBadgeProps {
  status: PatchStatus;
  latestVersion?: string | null;
  className?: string;
}

const STATUS_CONFIG = {
  current: {
    icon: CheckCircle2,
    label: "Current",
    color: "#9fe066",
    bg: "rgba(125,217,74,0.12)",
    border: "rgba(125,217,74,0.35)",
  },
  outdated: {
    icon: AlertCircle,
    label: "Outdated",
    color: "#ef5350",
    bg: "rgba(239,83,80,0.12)",
    border: "rgba(239,83,80,0.35)",
  },
  unknown: {
    icon: HelpCircle,
    label: "Unknown",
    color: "rgba(255,255,255,0.35)",
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.12)",
  },
  na: {
    icon: Settings,
    label: "N/A",
    color: "rgba(255,255,255,0.25)",
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
  },
};

export function PatchStatusBadge({ status, latestVersion, className = "" }: PatchStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      title={status === "na" ? "Managed by Apple" : latestVersion ? `Latest: ${latestVersion}` : undefined}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

export function patchStatusEmoji(status: PatchStatus): string {
  return status === "current" ? "✅" : status === "outdated" ? "🔴" : status === "na" ? "⚪" : "🟡";
}
