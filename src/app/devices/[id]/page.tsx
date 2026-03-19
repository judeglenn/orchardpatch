"use client";

import { use, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDeviceById, getAppById } from "@/lib/mockData";
import { SearchBar } from "@/components/SearchBar";
import { VersionBadge } from "@/components/VersionBadge";
import { formatDate, formatRelativeDate, appInitials, appColorClass, macOSName } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, Cpu, HardDrive, Clock, Package, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      (a) =>
        a.appName.toLowerCase().includes(q) || a.version.toLowerCase().includes(q)
    );
  }, [device.apps, search]);

  return (
    <div className="px-6 py-6">
      {/* Back button */}
      <div className="mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "#6b7280" }}
        >
          <ChevronLeft className="h-4 w-4" />
          App Catalog
        </Link>
      </div>

      {/* Device header */}
      <div
        className="flex items-center gap-5 mb-6 rounded-lg border bg-white px-6 py-5"
        style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          style={{ background: "#2d5016" }}
        >
          <Cpu className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold font-mono mb-1" style={{ color: "#1a1a2e" }}>
            {device.name}
          </h1>
          <p className="text-sm mb-2" style={{ color: "#6b7280" }}>
            {device.model}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "#6b7280" }}>
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              macOS {macOSName(device.osVersion) ? `${macOSName(device.osVersion)} ` : ""}{device.osVersion}
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              <strong style={{ color: "#1a1a2e" }}>{device.apps.length}</strong>&nbsp;apps installed
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Last inventory{" "}
              <strong style={{ color: "#1a1a2e" }}>{formatRelativeDate(device.lastInventory)}</strong>
              &nbsp;
              <span className="text-xs">({formatDate(device.lastInventory)})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Apps table */}
      <div
        className="rounded-lg border bg-white overflow-hidden"
        style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div
          className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ borderBottom: "1px solid #e2e4e7" }}
        >
          <div className="flex-1">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "#6b7280" }}
            >
              Installed Apps
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
              {filteredApps.length === device.apps.length
                ? `${device.apps.length} apps`
                : `${filteredApps.length} of ${device.apps.length} apps`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              style={{ background: "#2d5016", color: "white", borderColor: "#2d5016" }}
              onClick={() => {
                const outdated = filteredApps.filter((a) => {
                  const meta = getAppById(a.appId);
                  return meta && a.version !== meta.mostCommonVersion;
                });
                if (outdated.length === 0) {
                  alert("All apps are up to date!");
                } else {
                  alert(`Patching ${outdated.length} outdated app${outdated.length !== 1 ? "s" : ""}... (coming soon)`);
                }
              }}
            >
              <Zap className="h-3.5 w-3.5" />
              Patch All Outdated
            </Button>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Filter apps…"
              className="sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderColor: "#e2e4e7" }}>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  App Name
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Version
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Category
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Status
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-right"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Patch
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.length > 0 ? (
                filteredApps.map((appInst, idx) => {
                  const appMeta = getAppById(appInst.appId);
                  const initials = appInitials(appInst.appName);
                  const colorClass = appColorClass(appInst.appName);
                  const isOutdated = appMeta && appInst.version !== appMeta.mostCommonVersion;

                  return (
                    <TableRow
                      key={appInst.appId}
                      className="group"
                      style={{
                        background: idx % 2 === 1 ? "#fafafa" : "#ffffff",
                        borderColor: "#f3f4f6",
                      }}
                    >
                      <TableCell>
                        <Link
                          href={`/apps/${appInst.appId}`}
                          className="flex items-center gap-3 transition-colors text-[#1a1a2e] hover:text-[#2d5016]"
                        >
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold ${colorClass}`}
                          >
                            {initials}
                          </div>
                          <span className="text-sm font-medium">{appInst.appName}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-mono text-xs px-2 py-0.5 rounded"
                          style={
                            isOutdated
                              ? { background: "#fff3e0", color: "#e65100" }
                              : { color: "#6b7280" }
                          }
                        >
                          {appInst.version}
                        </span>
                      </TableCell>
                      <TableCell
                        className="hidden sm:table-cell text-xs"
                        style={{ color: "#6b7280" }}
                      >
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
                      <TableCell className="text-right">
                        {isOutdated ? (
                          <button
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                            style={{ background: "#2d5016", color: "white" }}
                            onClick={() => alert(`Patching ${appInst.appName}... (coming soon)`)}
                          >
                            Patch →
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ background: "#eef0f2", color: "#9ca3af" }}
                          >
                            Up to date
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-sm"
                    style={{ color: "#6b7280" }}
                  >
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
