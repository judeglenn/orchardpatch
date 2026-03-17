import Link from "next/link";
import { Monitor, Clock } from "lucide-react";
import { VersionBadge } from "@/components/VersionBadge";
import type { App } from "@/lib/mockData";
import { formatRelativeDate, appInitials, appColorClass } from "@/lib/utils";

interface AppCardProps {
  app: App;
}

export function AppCard({ app }: AppCardProps) {
  const initials = appInitials(app.name);
  const colorClass = appColorClass(app.name);

  return (
    <Link
      href={`/apps/${app.id}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm hover:shadow-md hover:border-[#0071BC]/30 dark:hover:border-blue-500/30 transition-all duration-200"
    >
      {/* App avatar */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold shadow-sm transition-transform group-hover:scale-105 ${colorClass}`}
      >
        {initials}
      </div>

      {/* App info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate group-hover:text-[#0071BC] dark:group-hover:text-blue-400 transition-colors">
            {app.name}
          </span>
          <VersionBadge hasConflict={app.hasVersionConflict} versionCount={app.versions.length} />
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono truncate">{app.mostCommonVersion}</span>
          <span className="text-border">·</span>
          <span className="capitalize">{app.category}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0 flex flex-col items-end gap-1 text-right">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
          {app.totalInstalls.toLocaleString()}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatRelativeDate(app.lastSeen)}
        </div>
      </div>
    </Link>
  );
}
