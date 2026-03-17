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

const COLORS = ["#0071BC", "#ff9800", "#4caf50", "#64b5f6", "#f44336", "#90caf9", "#ab47bc", "#26a69a"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg px-3 py-2 text-sm shadow-lg"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e4e7",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}
      >
        <p className="font-mono text-xs mb-0.5" style={{ color: "#6b7280" }}>
          {payload[0].name}
        </p>
        <p className="font-semibold" style={{ color: "#1a1a2e" }}>
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
    <div className="relative">
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
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ top: 0 }}
      >
        <span className="text-2xl font-bold" style={{ color: "#1a1a2e" }}>
          {total}
        </span>
        <span className="text-xs font-medium" style={{ color: "#6b7280" }}>
          devices
        </span>
      </div>
    </div>
  );
}
