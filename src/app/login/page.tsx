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
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0d1f0e 0%, #0a1a10 50%, #061209 100%)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl px-8 py-10"
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Logo / branding */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl mb-4"
            style={{
              background: "rgba(125,217,74,0.15)",
              border: "1px solid rgba(125,217,74,0.3)",
            }}
          >
            <Lock className="h-6 w-6" style={{ color: "#7dd94a" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#f0f8ec" }}>
            OrchardPatch
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Enter your passphrase to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Passphrase"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#f0f8ec",
              caretColor: "#7dd94a",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(125,217,74,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
          />

          {error && (
            <p className="text-xs text-center" style={{ color: "#ef9a9a" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background:
                loading || !password
                  ? "rgba(125,217,74,0.2)"
                  : "rgba(125,217,74,0.85)",
              color:
                loading || !password ? "rgba(255,255,255,0.45)" : "#0d1f0e",
              border: "1px solid rgba(125,217,74,0.4)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
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
