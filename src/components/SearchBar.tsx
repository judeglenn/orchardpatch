"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SearchBar({ value, onChange, placeholder = "Search...", className, style }: SearchBarProps) {
  return (
    <div
      className={className}
      style={{ position: "relative", ...style }}
    >
      <Search
        className="h-4 w-4"
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-tertiary)",
          pointerEvents: "none",
        }}
      />
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          paddingLeft: 34,
          paddingRight: value ? 34 : 12,
          height: 36,
          background: "var(--surface-raised)",
          border: "1px solid var(--border-hairline)",
          color: "var(--text-primary)",
          borderRadius: 10,
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--surface-raised)",
            color: "var(--text-tertiary)",
            cursor: "pointer",
          }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
