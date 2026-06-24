"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Incorrect password.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--page-bg)" }}
    >
      <div
        style={{ width: "100%", maxWidth: 384, borderRadius: 16, padding: "40px 32px", backgroundColor: "var(--surface-glass)", backgroundImage: "var(--sheen)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)" }}
      >
        {/* Logo / branding */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div
            style={{ display: "flex", width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, marginBottom: 16, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}
          >
            <Lock className="h-6 w-6" style={{ color: "var(--accent)" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            OrchardPatch
          </h1>
          <p style={{ fontSize: 14, marginTop: 4, color: "var(--text-secondary)" }}>
            Enter your passphrase to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="password"
            placeholder="Passphrase"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            style={{ width: "100%", borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", caretColor: "var(--accent)" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--border-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-hairline)")}
          />

          {error && (
            <p style={{ fontSize: 12, textAlign: "center", color: "var(--st-lagging)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{ width: "100%", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: loading || !password ? "not-allowed" : "pointer", opacity: loading || !password ? 0.5 : 1, background: "var(--accent)", color: "var(--page-bg)", border: "1px solid var(--border-accent)" }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
