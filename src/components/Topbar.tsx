"use client";

import Link from "next/link";

interface TopbarDashboardProps {
  type: "dashboard";
  title: string;
  subtitle?: string;
  syncLabel?: string;
  onSyncNow?: () => void;
}

interface TopbarAppDetailProps {
  type: "app-detail";
  appName: string;
  syncLabel?: string;
}

interface TopbarSimpleProps {
  type: "simple";
  title: string;
}

type TopbarProps = TopbarDashboardProps | TopbarAppDetailProps | TopbarSimpleProps;

const topbarStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  display: "flex",
  alignItems: "center",
  gap: 20,
  padding: "14px 30px",
  background: "var(--topbar-glass)",
  WebkitBackdropFilter: "blur(26px) saturate(180%)",
  backdropFilter: "blur(26px) saturate(180%)",
  borderBottom: "1px solid var(--border-hairline)",
  transition: "background-color 0.5s ease",
};

const SyncPill = ({ label }: { label: string }) => (
  <span style={{
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 12.5,
    color: "var(--text-secondary)",
    background: "var(--surface-glass)",
    border: "1px solid var(--border-hairline)",
    padding: "6px 12px",
    borderRadius: "var(--r-pill)",
  }}>
    <span style={{
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "var(--accent)",
      boxShadow: "0 0 8px var(--accent-glow)",
      display: "inline-block",
    }} />
    {label}
  </span>
);

export function Topbar(props: TopbarProps) {
  if (props.type === "dashboard") {
    return (
      <header style={topbarStyle}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            {props.title}
          </h1>
          {props.subtitle && (
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 1 }}>
              {props.subtitle}
            </div>
          )}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <SyncPill label={props.syncLabel ?? "Synced Today"} />
          {props.onSyncNow && (
            <button
              onClick={props.onSyncNow}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
                background: "var(--surface-glass)",
                border: "1px solid var(--border-hairline)",
                padding: "8px 13px",
                borderRadius: "var(--r-md)",
                boxShadow: "inset 0 1px 0 var(--rim-top)",
                transition: "background 0.14s, transform 0.08s",
                cursor: "pointer",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v5h-5"/>
              </svg>
              Sync now
            </button>
          )}
        </div>
      </header>
    );
  }

  if (props.type === "app-detail") {
    return (
      <header style={topbarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14 }}>
          <Link href="/apps" style={{
            width: 30,
            height: 30,
            borderRadius: "var(--r-sm)",
            display: "grid",
            placeItems: "center",
            background: "var(--surface-glass)",
            border: "1px solid var(--border-hairline)",
            boxShadow: "inset 0 1px 0 var(--rim-top)",
            transition: "background 0.14s",
            color: "var(--text-secondary)",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </Link>
          <Link href="/apps" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Apps</Link>
          <span style={{ color: "var(--text-tertiary)" }}>/</span>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{props.appName}</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <SyncPill label={props.syncLabel ?? "Synced Today"} />
        </div>
      </header>
    );
  }

  // simple
  return (
    <header style={topbarStyle}>
      <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
        {(props as TopbarSimpleProps).title}
      </h1>
    </header>
  );
}
