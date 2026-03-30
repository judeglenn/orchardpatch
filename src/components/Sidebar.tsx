"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Laptop, TreeDeciduous, BarChart3, Bell, Settings, ClipboardList } from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/", icon: LayoutGrid, label: "Apps", matchPrefix: "/apps" },
  { href: "/devices", icon: Laptop, label: "Devices", matchPrefix: "/devices" },
  { href: "/patches", icon: ClipboardList, label: "Patch History", matchPrefix: "/patches" },
];

const COMING_SOON_ITEMS = [
  { href: "/orchard", icon: TreeDeciduous, label: "Patch by the Orchard", matchPrefix: "/orchard" },
  { href: "/reports", icon: BarChart3, label: "Reports", matchPrefix: "/reports" },
  { href: "/alerts", icon: Bell, label: "Alerts", matchPrefix: "/alerts" },
];

const SETTINGS_ITEMS = [
  { href: "/settings", icon: Settings, label: "Settings", matchPrefix: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    if (item.href === "/") {
      return pathname === "/" || pathname.startsWith("/apps");
    }
    return pathname.startsWith(item.matchPrefix);
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-10 flex w-60 flex-col"
      style={{
        background: "rgba(5,10,3,0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-[18px] transition-opacity hover:opacity-80"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Image src="/orchardpatch-logo.png" alt="OrchardPatch" width={32} height={32} style={{ objectFit: "contain" }} />
        <div className="leading-none">
          <div className="text-sm font-bold tracking-tight" style={{ color: "#f0f8ec" }}>
            OrchardPatch
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2 px-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Inventory
          </span>
        </div>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150`}
              style={{
                color: active ? "#f0f8ec" : "rgba(255,255,255,0.55)",
                background: active ? "rgba(100,200,50,0.15)" : undefined,
                backdropFilter: active ? "blur(12px)" : undefined,
                WebkitBackdropFilter: active ? "blur(12px)" : undefined,
                borderLeft: active ? "2px solid #7dd94a" : "2px solid transparent",
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" style={{ color: active ? "#7dd94a" : undefined }} />
              {item.label}
            </Link>
          );
        })}

        {/* Coming Soon section */}
        <div className="mt-6 mb-2 px-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Enterprise
          </span>
        </div>
        {COMING_SOON_ITEMS.map((item) => {
          const active = pathname.startsWith(item.matchPrefix);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150"
              style={{
                color: active ? "#f0f8ec" : "rgba(255,255,255,0.55)",
                background: active ? "rgba(100,200,50,0.15)" : undefined,
                backdropFilter: active ? "blur(12px)" : undefined,
                WebkitBackdropFilter: active ? "blur(12px)" : undefined,
                borderLeft: active ? "2px solid #7dd94a" : "2px solid transparent",
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
              >
                Soon
              </span>
            </Link>
          );
        })}
        {/* Settings section */}
        <div className="mt-6 mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Configuration
          </span>
        </div>
        {SETTINGS_ITEMS.map((item) => {
          const active = pathname.startsWith(item.matchPrefix);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150"
              style={{
                color: active ? "#f0f8ec" : "rgba(255,255,255,0.55)",
                background: active ? "rgba(100,200,50,0.15)" : undefined,
                backdropFilter: active ? "blur(12px)" : undefined,
                WebkitBackdropFilter: active ? "blur(12px)" : undefined,
                borderLeft: active ? "2px solid #7dd94a" : "2px solid transparent",
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            v0.1.0 · OrchardPatch
          </span>
        </div>
      </div>
    </aside>
  );
}
