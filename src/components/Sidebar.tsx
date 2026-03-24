"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Laptop, Moon, Sun, TreeDeciduous, BarChart3, Bell, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/", icon: LayoutGrid, label: "Apps", matchPrefix: "/apps" },
  { href: "/devices", icon: Laptop, label: "Devices", matchPrefix: "/devices" },
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    if (item.href === "/") {
      return pathname === "/" || pathname.startsWith("/apps");
    }
    return pathname.startsWith(item.matchPrefix);
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-10 flex w-60 flex-col"
      style={{ background: "#1a2e0d" }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-[18px] transition-opacity hover:opacity-80"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Image src="/orchardpatch-logo.png" alt="OrchardPatch" width={32} height={32} style={{ objectFit: "contain" }} />
        <div className="leading-none">
          <div className="text-sm font-bold text-white tracking-tight">
            OrchardPatch
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2 px-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#a0aab4" }}
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
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "text-white"
                  : "text-[#a0aab4] hover:text-white hover:bg-white/5"
              }`}
              style={{
                background: active ? "rgba(45,80,22,0.35)" : undefined,
                borderLeft: active ? "2px solid #4a7c1f" : "2px solid transparent",
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Coming Soon section */}
        <div className="mt-6 mb-2 px-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#a0aab4" }}
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
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active ? "text-white" : "text-[#a0aab4] hover:text-white hover:bg-white/5"
              }`}
              style={{
                background: active ? "rgba(45,80,22,0.35)" : undefined,
                borderLeft: active ? "2px solid #4a7c1f" : "2px solid transparent",
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: "rgba(255,255,255,0.08)", color: "#a0aab4" }}
              >
                Soon
              </span>
            </Link>
          );
        })}
        {/* Settings section */}
        <div className="mt-6 mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#a0aab4" }}>
            Configuration
          </span>
        </div>
        {SETTINGS_ITEMS.map((item) => {
          const active = pathname.startsWith(item.matchPrefix);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active ? "text-white" : "text-[#a0aab4] hover:text-white hover:bg-white/5"
              }`}
              style={{
                background: active ? "rgba(45,80,22,0.35)" : undefined,
                borderLeft: active ? "2px solid #4a7c1f" : "2px solid transparent",
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
          <span className="text-[11px]" style={{ color: "#a0aab4" }}>
            v0.1.0 · OrchardPatch
          </span>
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded p-1 transition-colors text-[#a0aab4] hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
