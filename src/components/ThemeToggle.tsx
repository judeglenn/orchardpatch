"use client";

import { useEffect, useRef, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const userOverrideRef = useRef(false);

  function apply(t: "light" | "dark") {
    document.documentElement.setAttribute("data-theme", t);
    setTheme(t);
  }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    // Sync with current document state (set by the no-flash script)
    const current = document.documentElement.getAttribute("data-theme") as "light" | "dark";
    setTheme(current === "dark" ? "dark" : "light");

    function handleChange(e: MediaQueryListEvent) {
      if (!userOverrideRef.current) {
        apply(e.matches ? "dark" : "light");
      }
    }

    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  function handleClick(t: "light" | "dark") {
    userOverrideRef.current = true;
    apply(t);
  }

  return (
    <div
      className="theme-toggle"
      role="group"
      aria-label="Color theme"
      data-dark={theme === "dark" ? "" : undefined}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        background: "var(--surface-glass)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--r-pill)",
        padding: "3px",
        boxShadow: "inset 0 1px 0 var(--rim-top)",
      }}
    >
      {/* sun */}
      <button
        aria-label="Light mode"
        onClick={() => handleClick("light")}
        style={{
          position: "relative",
          zIndex: 1,
          width: 34,
          height: 26,
          display: "grid",
          placeItems: "center",
          borderRadius: "var(--r-pill)",
          color: theme === "light" ? "var(--accent)" : "var(--text-tertiary)",
          transition: "color 0.2s",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
        </svg>
      </button>
      {/* moon */}
      <button
        aria-label="Dark mode"
        onClick={() => handleClick("dark")}
        style={{
          position: "relative",
          zIndex: 1,
          width: 34,
          height: 26,
          display: "grid",
          placeItems: "center",
          borderRadius: "var(--r-pill)",
          color: theme === "dark" ? "var(--accent)" : "var(--text-tertiary)",
          transition: "color 0.2s",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>
        </svg>
      </button>
      {/* sliding thumb */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          zIndex: 0,
          top: 3,
          left: 3,
          width: 34,
          height: 26,
          borderRadius: "var(--r-pill)",
          background: "var(--surface-solid)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18), inset 0 1px 0 var(--rim-top)",
          transition: "transform 0.26s cubic-bezier(0.4,0,0.2,1)",
          transform: theme === "dark" ? "translateX(34px)" : "translateX(0)",
        }}
      />
    </div>
  );
}
