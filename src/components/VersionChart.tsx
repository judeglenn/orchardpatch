"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";

interface VersionChartProps {
  versions: { version: string; deviceCount: number }[];
}

const COLORS = ["#0071BC", "#2196f3", "#64b5f6", "#90caf9", "#bbdefb"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm">
        <p className="font-mono text-xs text-muted-foreground mb-1">{label}</p>
        <p className="font-semibold text-foreground">
          {payload[0].value} device{payload[0].value !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }
  return null;
}

export function VersionChart({ versions }: VersionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const data = versions
    .slice(0, 8)
    .map(v => ({
      version: v.version.length > 18 ? `...${v.version.slice(-14)}` : v.version,
      fullVersion: v.version,
      deviceCount: v.deviceCount,
    }));

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const axisColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis
          dataKey="version"
          tick={{ fontSize: 11, fill: axisColor, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: axisColor }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,113,188,0.06)" }} />
        <Bar dataKey="deviceCount" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
