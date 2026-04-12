import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionBadgeProps {
  hasConflict: boolean;
  versionCount?: number;
  className?: string;
}

export function VersionBadge({ hasConflict, versionCount, className }: VersionBadgeProps) {
  if (!hasConflict) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20",
          className
        )}
      >
        All Same Version
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 ring-1 ring-inset ring-amber-500/30",
        className
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {versionCount != null ? `${versionCount} versions` : "Conflict"}
    </span>
  );
}
