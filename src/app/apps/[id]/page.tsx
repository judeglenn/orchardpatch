
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppById, getAppInstallations } from "@/lib/mockData";
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

const COLORS = ["#2d5016", "#ff9800", "#4caf50", "#64b5f6", "#f44336", "#90caf9", "#ab47bc", "#26a69a"];

export default async function AppDetailPage({ params }: Props) {
  const { id } = await params;
  const app = getAppById(id);
  if (!app) notFound();

  const installations = getAppInstallations(id);
  const initials = appInitials(app.name);
  const colorClass = appColorClass(app.name);

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

      {/* App header */}
      <div
        className="flex items-center gap-5 mb-6 rounded-lg border bg-white px-6 py-5"
        style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white text-xl font-bold shadow-sm ${colorClass}`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>
              {app.name}
            </h1>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "#f0f7e8", color: "#2d5016" }}
            >
              {app.category}
            </span>
            {app.hasVersionConflict ? (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#fff3e0", color: "#e65100" }}
              >
                <AlertTriangle className="h-3 w-3" />
                {app.versions.length} versions
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#e8f5e9", color: "#2e7d32" }}
              >
                <CheckCircle2 className="h-3 w-3" />
                Consistent
              </span>
            )}
          </div>
          <p className="text-xs font-mono mb-2" style={{ color: "#6b7280" }}>
            {app.bundleId}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "#6b7280" }}>
            <span className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              <strong style={{ color: "#1a1a2e" }}>{app.totalInstalls}</strong>&nbsp;installs
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Last seen {formatRelativeDate(app.lastSeen)}
            </span>
          </div>
        </div>
      </div>

      {/* Version conflict / consistent banner */}
      {app.hasVersionConflict ? (
        <div
          className="mb-6 flex items-start gap-3 rounded-lg px-4 py-3.5"
          style={{
            background: "#fff8e1",
            border: "1px solid #ffe082",
          }}
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#f9a825" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e65100" }}>
              Version conflict detected
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#bf360c" }}>
              {app.versions.length} different versions of {app.name} are installed across your
              fleet. The most common version is{" "}
              <strong className="font-mono">{app.mostCommonVersion}</strong>. Consider pushing
              a policy to standardize.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="mb-6 flex items-start gap-3 rounded-lg px-4 py-3.5"
          style={{ background: "#f1f8e9", border: "1px solid #c5e1a5" }}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#43a047" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#2e7d32" }}>
              Version consistent
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#388e3c" }}>
              All {app.totalInstalls} devices are running{" "}
              <strong className="font-mono">{app.mostCommonVersion}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Version distribution — two-column */}
      {app.versions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Left: donut chart */}
          <div
            className="rounded-lg border bg-white p-5"
            style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1"
              style={{ color: "#6b7280" }}
            >
              Version Distribution
            </p>
            <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
              Devices per installed version
            </p>
            <VersionChartWrapper versions={app.versions} />
          </div>

          {/* Right: version breakdown list */}
          <div
            className="rounded-lg border bg-white p-5"
            style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1"
              style={{ color: "#6b7280" }}
            >
              Version Breakdown
            </p>
            <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
              {app.versions.length} version{app.versions.length !== 1 ? "s" : ""} detected
            </p>
            <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
              {app.versions.map((v, i) => {
                const pct = Math.round((v.deviceCount / app.totalInstalls) * 100);
                return (
                  <div key={v.version} className="flex items-center gap-3 py-2.5">
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-medium" style={{ color: "#1a1a2e" }}>
                          {v.version}
                        </span>
                        {i === 0 && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: "#f0f7e8", color: "#2d5016" }}
                          >
                            Most common
                          </span>
                        )}
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "#f3f4f6" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs shrink-0 w-28 text-right" style={{ color: "#6b7280" }}>
                      {v.deviceCount} device{v.deviceCount !== 1 ? "s" : ""} · {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Device installations table */}
      <div
        className="rounded-lg border bg-white overflow-hidden"
        style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid #e2e4e7" }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "#6b7280" }}
          >
            Installed Devices
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
            {installations.length} device{installations.length !== 1 ? "s" : ""} with{" "}
            {app.name} installed
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderColor: "#e2e4e7" }}>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Device Name
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Version
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#6b7280", background: "#fafafa" }}
                >
                  Last Inventory
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installations.map((inst, idx) => (
                <TableRow
                  key={inst.deviceId}
                  className="group"
                  style={{
                    background: idx % 2 === 1 ? "#fafafa" : "#ffffff",
                    borderColor: "#f3f4f6",
                  }}
                >
                  <TableCell>
                    <Link
                      href={`/devices/${inst.deviceId}`}
                      className="font-medium text-sm flex items-center gap-2 transition-colors text-[#1a1a2e] hover:text-[#2d5016]"
                    >
                      <Monitor className="h-3.5 w-3.5 shrink-0" style={{ color: "#9ca3af" }} />
                      {inst.deviceName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className="font-mono text-xs px-2 py-0.5 rounded"
                      style={
                        inst.version !== app.mostCommonVersion
                          ? { background: "#fff3e0", color: "#e65100" }
                          : { color: "#6b7280" }
                      }
                    >
                      {inst.version}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: "#6b7280" }}>
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
