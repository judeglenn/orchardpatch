"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VersionChartProps {
  versions: { version: string; deviceCount: number }[];
}

const COLORS = ["#2d5016", "#ff9800", "#4caf50", "#64b5f6", "#f44336", "#90caf9", "#ab47bc", "#26a69a"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 14,
          background: "var(--surface-glass)",
          border: "1px solid var(--border-hairline)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <p style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 2, color: "var(--text-tertiary)" }}>
          {payload[0].name}
        </p>
        <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {payload[0].value} device{payload[0].value !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }
  return null;
}

export function VersionChart({ versions }: VersionChartProps) {
  const data = versions.slice(0, 8).map((v) => ({
    name: v.version,
    value: v.deviceCount,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            paddingAngle={data.length > 1 ? 2 : 0}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          top: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
          {total}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
          devices
        </span>
      </div>
    </div>
  );
}
