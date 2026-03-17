"use client";

import { use, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDeviceById, getAppById } from "@/lib/mockData";
import { SearchBar } from "@/components/SearchBar";
import { VersionBadge } from "@/components/VersionBadge";
import { formatDate, formatRelativeDate, appInitials, appColorClass } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, Cpu, HardDrive, Clock, Package } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function DeviceDetailPage({ params }: Props) {
  const { id } = use(params);
  const device = getDeviceById(id);
  if (!device) notFound();

  const [search, setSearch] = useState("");

  const filteredApps = useMemo(() => {
    if (!search.trim()) return device.apps;
    const q = search.toLowerCase();
    return device.apps.filter(
      a =>
        a.appName.toLowerCase().includes(q) ||
        a.version.toLowerCase().includes(q)
    );
  }, [device.apps, search]);

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

      {/* Device header */}
      <div className="flex items-start gap-5 mb-8">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white text-lg font-bold shadow-md"
          style={{ background: "#0071BC" }}
        >
          <Cpu className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {device.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{device.model}</p>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              macOS {device.osVersion}
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              <strong className="text-foreground">{device.apps.length}</strong> apps installed
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Last inventory{" "}
              <strong className="text-foreground">{formatRelativeDate(device.lastInventory)}</strong>
              <span className="text-muted-foreground/60 text-xs">({formatDate(device.lastInventory)})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Apps table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">Installed Apps</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredApps.length === device.apps.length
                ? `${device.apps.length} apps`
                : `${filteredApps.length} of ${device.apps.length} apps`}
            </p>
          </div>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Filter apps…"
            className="sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  App Name
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Version
                </TableHead>
                <TableHead className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.length > 0 ? (
                filteredApps.map(appInst => {
                  const appMeta = getAppById(appInst.appId);
                  const initials = appInitials(appInst.appName);
                  const colorClass = appColorClass(appInst.appName);
                  const isOutdated = appMeta && appInst.version !== appMeta.mostCommonVersion;

                  return (
                    <TableRow key={appInst.appId} className="group">
                      <TableCell>
                        <Link
                          href={`/apps/${appInst.appId}`}
                          className="flex items-center gap-3 hover:text-[#0071BC] dark:hover:text-blue-400 transition-colors"
                        >
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold ${colorClass}`}
                          >
                            {initials}
                          </div>
                          <span className="text-sm font-medium text-foreground group-hover:text-[#0071BC] dark:group-hover:text-blue-400">
                            {appInst.appName}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded ${
                            isOutdated
                              ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50"
                              : "text-muted-foreground"
                          }`}
                        >
                          {appInst.version}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground capitalize">
                        {appMeta?.category ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {appMeta && (
                          <VersionBadge
                            hasConflict={isOutdated ?? false}
                            className="text-[10px]"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                    No apps match your search
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
