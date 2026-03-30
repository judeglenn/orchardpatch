"use client";

import { useEffect, useState } from "react";
import { checkAgent, AgentStatus } from "@/lib/agent";
import { WifiOff, X } from "lucide-react";

export function AgentBanner() {
  const [status, setStatus] = useState<AgentStatus>("checking");
  const [hostname, setHostname] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkAgent().then((result) => {
      setStatus(result.connected ? "connected" : "disconnected");
      if (result.hostname) setHostname(result.hostname);
    });
  }, []);

  if (dismissed || status === "checking") return null;

  if (status === "connected") {
    return (
      <div
        className="flex items-center justify-between px-4 py-2 text-xs font-medium"
        style={{
          background: "rgba(125,217,74,0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(125,217,74,0.2)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "#7dd94a" }} />
          <span style={{ color: "#9fe066" }}>
            OrchardPatch Agent connected · <strong>{hostname}</strong> · Live inventory
          </span>
        </div>
        <button onClick={() => setDismissed(true)} style={{ color: "rgba(255,255,255,0.4)" }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-xs font-medium"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
        <span style={{ color: "rgba(255,255,255,0.55)" }}>
          Agent not detected · Showing demo data ·{" "}
          <a href="/settings/jamf" className="underline" style={{ color: "#7dd94a" }}>
            Connect your fleet
          </a>
        </span>
      </div>
      <button onClick={() => setDismissed(true)} style={{ color: "rgba(255,255,255,0.35)" }}>
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
