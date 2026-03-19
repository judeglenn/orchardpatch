import Link from "next/link";
import { devices, stats } from "@/lib/mockData";
import { Laptop } from "lucide-react";
import { macOSName } from "@/lib/utils";

export const metadata = {
  title: "Devices — OrchardPatch",
};

export default function DevicesPage() {
  const sorted = [...devices].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1a1a2e" }}>
          Devices
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
          {stats.totalDevices.toLocaleString()} managed devices in fleet
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Total Devices", value: stats.totalDevices },
          { label: "macOS Versions", value: new Set(devices.map(d => d.osVersion)).size },
          { label: "Avg Apps / Device", value: Math.round(devices.reduce((s, d) => s + d.apps.length, 0) / devices.length) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-white px-5 py-4"
            style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            <div className="text-2xl font-bold" style={{ color: "#1a1a2e" }}>
              {stat.value.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs font-medium uppercase tracking-wide" style={{ color: "#6b7280" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Device table */}
      <div
        className="rounded-lg border bg-white overflow-hidden"
        style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-12 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide"
          style={{ background: "#f8f9fa", borderBottom: "1px solid #e2e4e7", color: "#6b7280" }}
        >
          <div className="col-span-4">Device Name</div>
          <div className="col-span-2">Model</div>
          <div className="col-span-2">macOS</div>
          <div className="col-span-2">Apps Installed</div>
          <div className="col-span-2">Last Inventory</div>
        </div>

        {/* Rows */}
        {sorted.map((device, i) => (
          <Link
            key={device.id}
            href={`/devices/${device.id}`}
            className="grid grid-cols-12 px-4 py-3 items-center transition-colors hover:bg-[#f5f6f7]"
            style={{
              borderBottom: i < sorted.length - 1 ? "1px solid #f0f1f3" : "none",
            }}
          >
            {/* Name */}
            <div className="col-span-4 flex items-center gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                style={{ background: "#eef0f2" }}
              >
                <Laptop className="h-4 w-4" style={{ color: "#6b7280" }} />
              </div>
              <span className="text-sm font-semibold hover:text-[#0071BC] transition-colors" style={{ color: "#1a1a2e" }}>
                {device.name}
              </span>
            </div>

            {/* Model */}
            <div className="col-span-2 text-sm" style={{ color: "#6b7280" }}>
              {device.model}
            </div>

            {/* OS */}
            <div className="col-span-2">
              <span
                className="inline-block rounded px-2 py-0.5 text-xs font-medium"
                style={{ background: "#eef7ff", color: "#0071BC" }}
              >
                {macOSName(device.osVersion) ? `${macOSName(device.osVersion)} ${device.osVersion}` : device.osVersion}
              </span>
            </div>

            {/* App count */}
            <div className="col-span-2 text-sm font-medium" style={{ color: "#1a1a2e" }}>
              {device.apps.length}
              <span className="font-normal text-xs ml-1" style={{ color: "#6b7280" }}>apps</span>
            </div>

            {/* Last inventory */}
            <div className="col-span-2 text-sm" style={{ color: "#6b7280" }}>
              {new Date(device.lastInventory).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
