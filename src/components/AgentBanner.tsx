"use client";

import { useEffect, useState } from "react";
import { WifiOff, X } from "lucide-react";

type FleetStatus = "checking" | "has-devices" | "no-devices" | "unreachable";

export function AgentBanner() {
  const [status, setStatus] = useState<FleetStatus>("checking");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/fleet/status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.connected) {
          setStatus("unreachable");
        } else if (data.deviceCount > 0) {
          setStatus("has-devices");
        } else {
          setStatus("no-devices");
        }
      })
      .catch(() => setStatus("unreachable"));
  }, []);

  // Hide while checking or when fleet has real device data
  if (dismissed || status === "checking" || status === "has-devices") return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: 500,
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <WifiOff className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
        <span style={{ color: "var(--text-secondary)" }}>
          {status === "no-devices" ? (
            <>
              No devices enrolled yet ·{" "}
              <a href="/settings/enrollment" style={{ textDecoration: "underline", color: "var(--accent)" }}>
                Connect your fleet
              </a>
            </>
          ) : (
            <>
              No fleet data ·{" "}
              <a href="/settings/enrollment" style={{ textDecoration: "underline", color: "var(--accent)" }}>
                Connect your fleet
              </a>
            </>
          )}
        </span>
      </div>
      <button onClick={() => setDismissed(true)} style={{ color: "var(--text-tertiary)", cursor: "pointer" }}>
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
