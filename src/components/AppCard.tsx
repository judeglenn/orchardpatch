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
    <div className="relative">
      <Link
        href={`/apps/${app.id}`}
        className="group flex items-center gap-4 rounded-2xl transition-all duration-150"
        style={{
          background: selected ? "rgba(125,217,74,0.1)" : "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: selected ? "1px solid rgba(125,217,74,0.35)" : "1px solid rgba(255,255,255,0.12)",
          boxShadow: selected
            ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(125,217,74,0.2)"
            : "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          paddingLeft: onToggle ? "2.75rem" : "1rem",
          paddingRight: "1rem",
          paddingTop: "0.875rem",
          paddingBottom: "0.875rem",
        }}
      >
        {/* Circle avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm transition-transform duration-150 group-hover:scale-105 ${colorClass}`}
        >
          {initials}
        </div>

        {/* App info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-semibold truncate transition-colors duration-150"
              style={{ color: "#f0f8ec" }}
            >
              {app.name}
            </span>
            <span
              className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}
            >
              {app.category}
            </span>
          </div>

          {/* Version mini-bar */}
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-24 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              {app.hasVersionConflict ? (
                <div className="h-full flex">
                  <div
                    className="h-full rounded-l-full"
                    style={{ width: `${majorityPct}%`, background: "#4caf50" }}
                  />
                  <div
                    className="h-full rounded-r-full"
                    style={{ width: `${otherPct}%`, background: "#ff9800" }}
                  />
                </div>
              ) : (
                <div className="h-full rounded-full w-full" style={{ background: "#7dd94a" }} />
              )}
            </div>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              {app.hasVersionConflict
                ? `${app.versions.length} versions`
                : app.mostCommonVersion}
            </span>
          </div>
        </div>

        {/* Right side: installs + conflict badge */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
            <span className="text-sm font-semibold" style={{ color: "#f0f8ec" }}>
              {app.totalInstalls.toLocaleString()}<span className="font-normal text-xs" style={{ color: "rgba(255,255,255,0.55)" }}> / {totalDevices.toLocaleString()}</span>
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
          className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center z-10 rounded-l-2xl"
          onClick={() => onToggle(app.id)}
          aria-label={selected ? `Deselect ${app.name}` : `Select ${app.name}`}
        >
          <div
            className="h-4 w-4 rounded border-2 flex items-center justify-center transition-all duration-150 flex-shrink-0"
            style={{
              borderColor: selected ? "#7dd94a" : "rgba(255,255,255,0.3)",
              background: selected ? "#5aaa28" : "rgba(255,255,255,0.05)",
            }}
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>
      )}
    </div>
  );
}
