"use client";

import { useEffect, useState } from "react";
import { checkAgent, AgentStatus } from "@/lib/agent";
import { Wifi, WifiOff, Loader2, X } from "lucide-react";

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
        style={{ background: "#f0f7e8", borderBottom: "1px solid #c5e1a5" }}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "#4caf50" }} />
          <span style={{ color: "#2d5016" }}>
            OrchardPatch Agent connected · <strong>{hostname}</strong> · Live inventory
          </span>
        </div>
        <button onClick={() => setDismissed(true)} style={{ color: "#2d5016" }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-xs font-medium"
      style={{ background: "#f3f4f6", borderBottom: "1px solid #e2e4e7" }}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-3.5 w-3.5" style={{ color: "#9ca3af" }} />
        <span style={{ color: "#6b7280" }}>
          Agent not detected · Showing demo data ·{" "}
          <a href="/settings/jamf" className="underline hover:text-[#2d5016]">
            Connect your fleet
          </a>
        </span>
      </div>
      <button onClick={() => setDismissed(true)} style={{ color: "#9ca3af" }}>
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
