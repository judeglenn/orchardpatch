import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppById, getAppInstallations } from "@/lib/mockData";
import { VersionBadge } from "@/components/VersionBadge";
import { VersionChartWrapper } from "@/components/VersionChartWrapper";
import { appInitials, appColorClass, formatDate, formatRelativeDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, AlertTriangle, Monitor, CheckCircle2, Clock } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AppDetailPage({ params }: Props) {
  const { id } = await params;
  const app = getAppById(id);
  if (!app) notFound();

  const installations = getAppInstallations(id);
  const initials = appInitials(app.name);
  const colorClass = appColorClass(app.name);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to App Catalog
        </Link>
      </div>

      {/* App header */}
      <div className="flex items-start gap-5 mb-8">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white text-xl font-bold shadow-md ${colorClass}`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{app.name}</h1>
            <VersionBadge hasConflict={app.hasVersionConflict} versionCount={app.versions.length} />
          </div>
          <p className="text-sm text-muted-foreground font-mono mt-1">{app.bundleId}</p>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              <strong className="text-foreground">{app.totalInstalls}</strong> installs
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Last seen {formatRelativeDate(app.lastSeen)}
            </span>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: "#e8f4fd", color: "#0071BC" }}
            >
              {app.category}
            </span>
          </div>
        </div>
      </div>

      {/* Version conflict warning */}
      {app.hasVersionConflict && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-4 py-3.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Version conflict detected
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {app.versions.length} different versions of {app.name} are installed across your fleet.
              The most common version is <strong className="font-mono">{app.mostCommonVersion}</strong>.
              Consider pushing a policy to standardize to the latest version.
            </p>
          </div>
        </div>
      )}

      {!app.hasVersionConflict && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 px-4 py-3.5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Version consistent
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              All {app.totalInstalls} devices are running{" "}
              <strong className="font-mono">{app.mostCommonVersion}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Version distribution */}
      {app.versions.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-1">Version Distribution</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Number of devices per installed version
          </p>
          <VersionChartWrapper versions={app.versions} />

          {/* Version breakdown table */}
          <div className="mt-4 divide-y divide-border">
            {app.versions.map((v, i) => (
              <div key={v.version} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: ["#0071BC", "#2196f3", "#64b5f6", "#90caf9", "#bbdefb"][i % 5] }}
                  />
                  <span className="text-sm font-mono text-foreground">{v.version}</span>
                  {i === 0 && (
                    <span className="text-xs rounded-full px-1.5 py-0.5 font-medium"
                      style={{ background: "#e8f4fd", color: "#0071BC" }}>
                      Most common
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 sm:w-32 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: ["#0071BC", "#2196f3", "#64b5f6", "#90caf9", "#bbdefb"][i % 5],
                        width: `${(v.deviceCount / app.totalInstalls) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-20 text-right">
                    {v.deviceCount} device{v.deviceCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device installations table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Installed Devices</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {installations.length} device{installations.length !== 1 ? "s" : ""} with {app.name} installed
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Device Name
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Version
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Last Inventory
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installations.map(inst => (
                <TableRow key={inst.deviceId} className="group">
                  <TableCell>
                    <Link
                      href={`/devices/${inst.deviceId}`}
                      className="font-medium text-sm text-foreground hover:text-[#0071BC] dark:hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      <Monitor className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#0071BC] dark:group-hover:text-blue-400 shrink-0" />
                      {inst.deviceName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded ${
                        inst.version === app.mostCommonVersion
                          ? "text-foreground"
                          : "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50"
                      }`}
                    >
                      {inst.version}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(inst.lastInventory)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
