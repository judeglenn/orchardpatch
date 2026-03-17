"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", icon: LayoutGrid, label: "Apps", matchPrefix: "/apps" },
  { href: "/devices", icon: Laptop, label: "Devices", matchPrefix: "/devices" },
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
      className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col"
      style={{ background: "#1d2025" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-[18px]"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
          style={{ background: "#0071BC" }}
        >
          <LayoutGrid className="h-4 w-4 text-white" />
        </div>
        <div className="leading-none">
          <div className="text-sm font-bold text-white tracking-tight">
            jamf
            <span style={{ color: "#a0aab4" }} className="font-normal">
              {" "}
              |{" "}
            </span>
            <span className="font-semibold text-white">App Inventory</span>
          </div>
          <div className="mt-0.5 text-[11px]" style={{ color: "#a0aab4" }}>
            Fleet software catalog
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2 px-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#a0aab4" }}
          >
            Catalog
          </span>
        </div>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150"
              style={{
                color: active ? "#ffffff" : "#a0aab4",
                background: active ? "rgba(0,113,188,0.18)" : "transparent",
                borderLeft: active ? "2px solid #0071BC" : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#ffffff";
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#a0aab4";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
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
            v1.0.0 · Mock Data
          </span>
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded p-1 transition-colors"
              style={{ color: "#a0aab4" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#ffffff")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#a0aab4")
              }
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
