import Link from "next/link";
import { Monitor, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { App } from "@/lib/mockData";
import { appInitials, appColorClass } from "@/lib/utils";

interface AppCardProps {
  app: App;
  totalDevices: number;
  selected?: boolean;
  onToggle?: (id: string) => void;
}

export function AppCard({ app, totalDevices, selected, onToggle }: AppCardProps) {
  const initials = appInitials(app.name);
  const colorClass = appColorClass(app.name);

  const majorityCount = app.versions[0]?.deviceCount ?? app.totalInstalls;
  const majorityPct = app.totalInstalls > 0 ? (majorityCount / app.totalInstalls) * 100 : 100;
  const otherPct = 100 - majorityPct;

  return (
    <div className="relative">
      <Link
        href={`/apps/${app.id}`}
        className="group flex items-center gap-4 rounded-lg border bg-white transition-all duration-150 hover:shadow-md"
        style={{
          borderColor: selected ? "#2d5016" : "#e2e4e7",
          boxShadow: selected
            ? "0 0 0 1px #2d501640, 0 1px 3px rgba(0,0,0,0.06)"
            : "0 1px 2px rgba(0,0,0,0.04)",
          background: selected ? "#f6faf0" : "white",
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
              className="text-sm font-semibold truncate transition-colors duration-150 group-hover:text-[#2d5016]"
              style={{ color: "#1a1a2e" }}
            >
              {app.name}
            </span>
            <span
              className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "#eef0f2", color: "#6b7280" }}
            >
              {app.category}
            </span>
          </div>

          {/* Version mini-bar */}
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 w-24 rounded-full overflow-hidden"
              style={{ background: "#eef0f2" }}
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
                <div className="h-full rounded-full w-full" style={{ background: "#4caf50" }} />
              )}
            </div>
            <span className="text-[11px]" style={{ color: "#6b7280" }}>
              {app.hasVersionConflict
                ? `${app.versions.length} versions`
                : app.mostCommonVersion}
            </span>
          </div>
        </div>

        {/* Right side: installs + conflict badge */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5" style={{ color: "#6b7280" }} />
            <span className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>
              {app.totalInstalls.toLocaleString()}<span className="font-normal text-xs" style={{ color: "#6b7280" }}> / {totalDevices.toLocaleString()}</span>
            </span>
          </div>
          {app.hasVersionConflict ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "#fff3e0", color: "#e65100" }}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              Conflict
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "#e8f5e9", color: "#2e7d32" }}
            >
              <CheckCircle2 className="h-2.5 w-2.5" />
              Consistent
            </span>
          )}
        </div>
      </Link>

      {/* Checkbox — sits outside Link so clicks don't navigate */}
      {onToggle && (
        <button
          className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center z-10 rounded-l-lg"
          onClick={() => onToggle(app.id)}
          aria-label={selected ? `Deselect ${app.name}` : `Select ${app.name}`}
        >
          <div
            className="h-4 w-4 rounded border-2 flex items-center justify-center transition-all duration-150 flex-shrink-0"
            style={{
              borderColor: selected ? "#2d5016" : "#9ca3af",
              background: selected ? "#2d5016" : "white",
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
