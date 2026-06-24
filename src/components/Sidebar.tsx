"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  matchPrefix: string;
  icon: React.ReactNode;
  soon?: boolean;
}

// SVG icons inline matching the reference HTML
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, strokeWidth: 1.7, flexShrink: 0 }}>
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const AppsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, strokeWidth: 1.7, flexShrink: 0 }}>
    <rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/>
    <rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>
  </svg>
);
const CatalogIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, strokeWidth: 1.7, flexShrink: 0 }}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>
  </svg>
);
const DevicesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, strokeWidth: 1.7, flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/>
  </svg>
);
const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, strokeWidth: 1.7, flexShrink: 0 }}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>
  </svg>
);
const CultivationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, strokeWidth: 1.7, flexShrink: 0 }}>
    <path d="M12 20V9"/><path d="M12 9c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6z"/><path d="M12 12c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z"/>
  </svg>
);
const ReportsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, strokeWidth: 1.7, flexShrink: 0 }}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>
  </svg>
);
const AlertsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, strokeWidth: 1.7, flexShrink: 0 }}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, strokeWidth: 1.7, flexShrink: 0 }}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.4.6 1.65 1.65 0 0 0-.36 1.06V22a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 20.4a1.65 1.65 0 0 0-2.4-.6l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 15a1.65 1.65 0 0 0-1.51-1H1a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6 1.65 1.65 0 0 0 9 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 9.6V10a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", matchPrefix: "/dashboard", icon: <DashboardIcon /> },
  { href: "/apps", label: "Apps", matchPrefix: "/apps", icon: <AppsIcon /> },
  { href: "/catalog", label: "Catalog", matchPrefix: "/catalog", icon: <CatalogIcon /> },
  { href: "/fleet", label: "Devices", matchPrefix: "/fleet", icon: <DevicesIcon /> },
  { href: "/patches", label: "Patch History", matchPrefix: "/patches", icon: <HistoryIcon /> },
];

const ENTERPRISE_ITEMS: NavItem[] = [
  { href: "/orchard", label: "Cultivation", matchPrefix: "/orchard", icon: <CultivationIcon />, soon: true },
  { href: "/reports", label: "Reports", matchPrefix: "/reports", icon: <ReportsIcon />, soon: true },
  { href: "/alerts", label: "Alerts", matchPrefix: "/alerts", icon: <AlertsIcon />, soon: true },
];

const SETTINGS_ITEMS: NavItem[] = [
  { href: "/settings", label: "Settings", matchPrefix: "/settings", icon: <SettingsIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(item.matchPrefix);
  }

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "9px 10px",
    borderRadius: "var(--r-sm)",
    color: active ? "#fff" : "rgba(255,255,255,0.55)",
    fontSize: 13.5,
    fontWeight: 500,
    letterSpacing: "-0.005em",
    transition: "background 0.14s, color 0.14s",
    background: active ? "rgba(255,255,255,0.11)" : undefined,
    boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.09)" : undefined,
    textDecoration: "none",
  });

  const activeBarStyle: React.CSSProperties = {
    content: '""',
    position: "absolute",
    left: -14,
    top: "50%",
    transform: "translateY(-50%)",
    width: 3,
    height: 20,
    borderRadius: "0 3px 3px 0",
    background: "var(--sidebar-accent)",
    boxShadow: "0 0 12px 0 var(--sidebar-accent)",
  };

  function renderNavItem(item: NavItem) {
    const active = isActive(item);
    return (
      <Link key={item.href} href={item.href} style={navItemStyle(active)}>
        {active && <span aria-hidden="true" style={activeBarStyle} />}
        {item.icon}
        {item.label}
        {item.soon && (
          <span style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.03em",
            color: "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.08)",
            padding: "2px 7px",
            borderRadius: "var(--r-pill)",
          }}>
            Soon
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside style={{
      position: "sticky",
      top: 0,
      alignSelf: "flex-start",
      width: 248,
      height: "100vh",
      flexShrink: 0,
      overflow: "hidden",
      backgroundColor: "var(--sidebar-bg)",
      WebkitBackdropFilter: "blur(36px) saturate(165%)",
      backdropFilter: "blur(36px) saturate(165%)",
      borderRight: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.20), inset 0 11px 13px -13px rgba(255,255,255,0.16), inset -1px 0 0 rgba(255,255,255,0.04), 0 22px 54px -22px rgba(16,30,20,0.5)",
      display: "flex",
      flexDirection: "column",
      padding: "20px 14px 14px",
      zIndex: 30,
      transition: "background-color 0.5s ease",
    }}>
      {/* Brand */}
      <div style={{ padding: "2px 8px 18px" }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", color: "#fff" }}>
            Orchard<b style={{ color: "var(--sidebar-accent)", fontWeight: 600 }}>Patch</b>
          </span>
        </Link>
      </div>

      {/* Inventory group */}
      <div style={{ marginTop: 14 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          padding: "0 10px",
          marginBottom: 6,
        }}>
          Inventory
        </div>
        {NAV_ITEMS.map(renderNavItem)}
      </div>

      {/* Enterprise group */}
      <div style={{ marginTop: 14 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          padding: "0 10px",
          marginBottom: 6,
        }}>
          Enterprise
        </div>
        {ENTERPRISE_ITEMS.map(renderNavItem)}
      </div>

      {/* Configuration group */}
      <div style={{ marginTop: 14 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          padding: "0 10px",
          marginBottom: 6,
        }}>
          Configuration
        </div>
        {SETTINGS_ITEMS.map(renderNavItem)}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "auto",
        padding: "12px 10px 2px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        fontSize: 11.5,
        color: "rgba(255,255,255,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 7,
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--sidebar-accent)",
          boxShadow: "0 0 9px var(--sidebar-accent)",
          display: "inline-block",
          flexShrink: 0,
        }} />
        v0.1.0 · OrchardPatch
        <div style={{ marginLeft: "auto" }}>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
