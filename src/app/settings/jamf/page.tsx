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
    <div style={{ padding: "24px", maxWidth: "42rem" }}>
      {/* Back */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-secondary)" }}>
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ display: "flex", width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, background: "var(--accent-tint)" }}>
          <Link2 className="h-6 w-6" style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Jamf Pro</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Connect your Jamf Pro instance to pull live device and app inventory</p>
        </div>
      </div>

      {/* Security note */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 12, padding: "12px 16px", marginBottom: 24, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
        <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-primary)" }}>
          OrchardPatch uses <strong>read-only API access</strong>. We never write to your Jamf instance. 
          Create a dedicated API role with <strong>Read Computers</strong> permission only.
        </p>
      </div>

      {/* Form */}
      <div style={{ borderRadius: 12, padding: 24, marginBottom: 16, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Server URL */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>
              Jamf Pro Server URL
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://yourorg.jamfcloud.com"
              style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border-hairline)", padding: "10px 12px", fontSize: 14, outline: "none", background: "var(--surface-raised)", color: "var(--text-primary)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--border-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-hairline)")}
            />
            {normalizedUrl && (
              <p style={{ fontSize: 10, marginTop: 4, color: "var(--text-tertiary)" }}>
                API endpoint: {normalizedUrl}/api/v1/computers-inventory
              </p>
            )}
          </div>

          {/* Client ID */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="API client ID from Jamf Pro → Settings → API roles"
              style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border-hairline)", padding: "10px 12px", fontSize: 14, fontFamily: "monospace", outline: "none", background: "var(--surface-raised)", color: "var(--text-primary)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--border-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-hairline)")}
            />
          </div>

          {/* Client Secret */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>
              Client Secret
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showSecret ? "text" : "password"}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="••••••••••••••••"
                style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border-hairline)", padding: "10px 40px 10px 12px", fontSize: 14, fontFamily: "monospace", outline: "none", background: "var(--surface-raised)", color: "var(--text-primary)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--border-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-hairline)")}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", cursor: "pointer" }}
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
          style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, background: status === "success" ? "var(--accent-tint)" : status === "error" ? "color-mix(in srgb, var(--st-outdated) 8%, transparent)" : "var(--surface-raised)", border: `1px solid ${status === "success" ? "var(--border-accent)" : status === "error" ? "color-mix(in srgb, var(--st-outdated) 30%, transparent)" : "var(--border-hairline)"}` }}
        >
          {status === "testing" && <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: "var(--text-secondary)" }} />}
          {status === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "var(--st-current)" }} />}
          {status === "error" && <XCircle className="h-4 w-4 shrink-0" style={{ color: "var(--st-outdated)" }} />}
          <span style={{ color: status === "success" ? "var(--st-current)" : status === "error" ? "var(--st-outdated)" : "var(--text-secondary)" }}>
            {status === "testing" ? "Testing connection…" : statusMessage}
          </span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={testConnection}
          disabled={status === "testing"}
          style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "var(--accent-tint)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}
        >
          {status === "testing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Test Connection
        </button>
        <button
          onClick={saveConfig}
          style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "var(--accent)", color: "var(--page-bg)" }}
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : null}
          {saved ? "Saved!" : "Save Configuration"}
        </button>
      </div>

      {/* Setup guide */}
      <div style={{ marginTop: 32, borderRadius: 12, padding: 20, backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: "var(--text-primary)" }}>How to set up API access in Jamf Pro</p>
        <ol style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "In Jamf Pro, go to Settings → System → API roles and clients",
            "Create a new API Role — name it 'OrchardPatch Read-Only', add Read Computer Inventory Collection permission",
            "Create a new API Client — name it 'OrchardPatch', assign the role above, set Access Token Lifetime to 30 minutes",
            "Toggle Enable API Client to ON, then click Save",
            "Copy the Client ID shown, then click Generate Secret and copy it immediately (shown only once)",
            "Paste both above and click Test Connection",
          ].map((step, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "var(--text-secondary)" }}>
              <span
                style={{ display: "flex", width: 20, height: 20, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 9999, fontSize: 10, fontWeight: 700, background: "var(--accent-tint)", color: "var(--accent)" }}
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
