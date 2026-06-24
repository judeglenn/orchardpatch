import Link from "next/link";
import { Monitor } from "lucide-react";
import type { App } from "@/lib/mockData";
import { appInitials, appColorClass } from "@/lib/utils";
import { PatchStatusBadge, type PatchStatus } from "@/components/PatchStatusBadge";

interface AppCardProps {
  app: App;
  totalDevices: number;
  selected?: boolean;
  onToggle?: (id: string) => void;
  patchStatus?: PatchStatus;
  latestVersion?: string | null;
}

export function AppCard({ app, totalDevices, selected, onToggle, patchStatus, latestVersion }: AppCardProps) {
  const initials = appInitials(app.name);
  const colorClass = appColorClass(app.name);

  const majorityCount = app.versions[0]?.deviceCount ?? app.totalInstalls;
  const majorityPct = app.totalInstalls > 0 ? Math.round((majorityCount / app.totalInstalls) * 100) : 100;
  const otherPct = 100 - majorityPct;

  return (
    <div style={{ position: "relative" }}>
      <Link
        href={`/apps/${app.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderRadius: 16,
          backgroundColor: selected ? "var(--accent-tint)" : "var(--surface-glass)",
          backgroundImage: "var(--sheen)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          border: selected ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
          boxShadow: "var(--shadow-card)",
          paddingLeft: onToggle ? "2.75rem" : "1rem",
          paddingRight: "1rem",
          paddingTop: "0.875rem",
          paddingBottom: "0.875rem",
          textDecoration: "none",
        }}
      >
        {/* Circle avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold ${colorClass}`}
        >
          {initials}
        </div>

        {/* App info */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "var(--text-primary)",
              }}
            >
              {app.name}
            </span>
            <span
              style={{
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: 4,
                background: "var(--surface-raised)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-hairline)",
              }}
            >
              {app.category}
            </span>
          </div>

          {/* Version mini-bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                height: 6,
                width: 96,
                borderRadius: 9999,
                overflow: "hidden",
                background: "var(--surface-raised)",
                flexShrink: 0,
              }}
            >
              {app.hasVersionConflict ? (
                <div style={{ height: "100%", display: "flex" }}>
                  <div style={{ height: "100%", width: `${majorityPct}%`, background: "var(--st-current)", borderRadius: "9999px 0 0 9999px" }} />
                  <div style={{ height: "100%", width: `${otherPct}%`, background: "var(--st-outdated)", borderRadius: "0 9999px 9999px 0" }} />
                </div>
              ) : (
                <div style={{ height: "100%", width: "100%", borderRadius: 9999, background: "var(--st-current)" }} />
              )}
            </div>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {app.hasVersionConflict
                ? `${app.versions.length} versions`
                : app.mostCommonVersion}
            </span>
          </div>
        </div>

        {/* Right side: installs + status badge */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Monitor style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              {app.totalInstalls.toLocaleString()}
              <span style={{ fontWeight: 400, fontSize: 12, color: "var(--text-secondary)" }}> / {totalDevices.toLocaleString()}</span>
            </span>
          </div>
          <PatchStatusBadge
            status={patchStatus ?? (app.hasVersionConflict ? "outdated" : "unknown")}
            latestVersion={latestVersion}
          />
        </div>
      </Link>

      {/* Checkbox — sits outside Link so clicks don't navigate */}
      {onToggle && (
        <button
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            borderRadius: "16px 0 0 16px",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => onToggle(app.id)}
          aria-label={selected ? `Deselect ${app.name}` : `Select ${app.name}`}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              border: `2px solid ${selected ? "var(--accent)" : "var(--text-tertiary)"}`,
              background: selected ? "var(--accent)" : "var(--surface-raised)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="var(--page-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>
      )}
    </div>
  );
}
