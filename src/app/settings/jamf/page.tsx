"use client";

import { useState, useEffect } from "react";
import { Link2, CheckCircle2, XCircle, Loader2, ChevronLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";

type ConnectionStatus = "idle" | "testing" | "success" | "error";

export default function JamfSettingsPage() {
  const [serverUrl, setServerUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [saved, setSaved] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    const saved = localStorage.getItem("jamf-config");
    if (saved) {
      const config = JSON.parse(saved);
      setServerUrl(config.serverUrl || "");
      setClientId(config.clientId || "");
      setClientSecret(config.clientSecret || "");
    }
  }, []);

  async function testConnection() {
    if (!serverUrl || !clientId || !clientSecret) {
      setStatus("error");
      setStatusMessage("All fields are required.");
      return;
    }

    setStatus("testing");
    setStatusMessage("");

    const base = serverUrl.replace(/\/$/, "");

    try {
      // Step 1: Get bearer token directly from browser (avoids Vercel → Jamf network restrictions)
      const tokenRes = await fetch(`${base}/api/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenRes.ok) {
        setStatus("error");
        setStatusMessage("Authentication failed. Check your Client ID and Secret.");
        return;
      }

      const { access_token } = await tokenRes.json();

      // Step 2: Fetch inventory count
      const inventoryRes = await fetch(
        `${base}/api/v1/computers-inventory?page=0&page-size=1&section=GENERAL`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
          },
        }
      );

      if (!inventoryRes.ok) {
        setStatus("error");
        setStatusMessage("Connected but could not fetch inventory. Check API role permissions.");
        return;
      }

      const inventory = await inventoryRes.json();
      const deviceCount = inventory.totalCount ?? 0;

      // Store token for later use
      localStorage.setItem("jamf-token", access_token);
      localStorage.setItem("jamf-token-ts", Date.now().toString());

      setStatus("success");
      setStatusMessage(`Connected to ${base.replace("https://", "")} · ${deviceCount} device${deviceCount !== 1 ? "s" : ""} found`);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setStatusMessage("Could not reach Jamf Pro. Check the server URL and that you're on the same network.");
    }
  }

  function saveConfig() {
    localStorage.setItem("jamf-config", JSON.stringify({ serverUrl, clientId, clientSecret }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const normalizedUrl = serverUrl.replace(/\/$/, "");

  return (
    <div className="px-6 py-6 max-w-2xl">
      {/* Back */}
      <div className="mb-5">
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "#6b7280" }}>
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#f0f7e8" }}>
          <Link2 className="h-6 w-6" style={{ color: "#2d5016" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Jamf Pro</h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>Connect your Jamf Pro instance to pull live device and app inventory</p>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-6" style={{ background: "#f0f7e8", border: "1px solid #c5e1a5" }}>
        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#2d5016" }} />
        <p className="text-xs leading-relaxed" style={{ color: "#2d5016" }}>
          OrchardPatch uses <strong>read-only API access</strong>. We never write to your Jamf instance. 
          Create a dedicated API role with <strong>Read Computers</strong> permission only.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl border bg-white p-6 mb-4" style={{ borderColor: "#e2e4e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div className="flex flex-col gap-5">
          {/* Server URL */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#1a1a2e" }}>
              Jamf Pro Server URL
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://yourorg.jamfcloud.com"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all"
              style={{ borderColor: "#e2e4e7", color: "#1a1a2e" }}
              onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e4e7")}
            />
            {normalizedUrl && (
              <p className="text-[10px] mt-1" style={{ color: "#9ca3af" }}>
                API endpoint: {normalizedUrl}/api/v1/computers-inventory
              </p>
            )}
          </div>

          {/* Client ID */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#1a1a2e" }}>
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="API client ID from Jamf Pro → Settings → API roles"
              className="w-full rounded-lg border px-3 py-2.5 text-sm font-mono outline-none transition-all"
              style={{ borderColor: "#e2e4e7", color: "#1a1a2e" }}
              onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e4e7")}
            />
          </div>

          {/* Client Secret */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#1a1a2e" }}>
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full rounded-lg border px-3 py-2.5 pr-10 text-sm font-mono outline-none transition-all"
                style={{ borderColor: "#e2e4e7", color: "#1a1a2e" }}
                onFocus={(e) => (e.target.style.borderColor = "#2d5016")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e4e7")}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9ca3af" }}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {status !== "idle" && (
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4 text-sm"
          style={{
            background: status === "success" ? "#f0f7e8" : status === "error" ? "#fff3e0" : "#f3f4f6",
            border: `1px solid ${status === "success" ? "#c5e1a5" : status === "error" ? "#ffcc80" : "#e2e4e7"}`,
          }}
        >
          {status === "testing" && <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: "#6b7280" }} />}
          {status === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#2e7d32" }} />}
          {status === "error" && <XCircle className="h-4 w-4 shrink-0" style={{ color: "#e65100" }} />}
          <span style={{ color: status === "success" ? "#2e7d32" : status === "error" ? "#e65100" : "#6b7280" }}>
            {status === "testing" ? "Testing connection…" : statusMessage}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={testConnection}
          disabled={status === "testing"}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "#f0f7e8", color: "#2d5016", border: "1px solid #c5e1a5" }}
        >
          {status === "testing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Test Connection
        </button>
        <button
          onClick={saveConfig}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: "#2d5016", color: "white" }}
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : null}
          {saved ? "Saved!" : "Save Configuration"}
        </button>
      </div>

      {/* Setup guide */}
      <div className="mt-8 rounded-xl border p-5" style={{ borderColor: "#e2e4e7" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "#1a1a2e" }}>How to set up API access in Jamf Pro</p>
        <ol className="flex flex-col gap-2">
          {[
            "In Jamf Pro, go to Settings → System → API roles and clients",
            "Create a new API Role — name it 'OrchardPatch Read-Only', add Read Computer Inventory Collection permission",
            "Create a new API Client — name it 'OrchardPatch', assign the role above, set Access Token Lifetime to 30 minutes",
            "Toggle Enable API Client to ON, then click Save",
            "Copy the Client ID shown, then click Generate Secret and copy it immediately (shown only once)",
            "Paste both above and click Test Connection",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: "#6b7280" }}>
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: "#f0f7e8", color: "#2d5016" }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
