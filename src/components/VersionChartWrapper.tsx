"use client";

import dynamic from "next/dynamic";

const VersionChart = dynamic(() => import("@/components/VersionChart").then(m => m.VersionChart), {
  ssr: false,
  loading: () => (
    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        className="animate-spin"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "2px solid var(--accent)",
          borderTopColor: "transparent",
        }}
      />
    </div>
  ),
});

interface Props {
  versions: { version: string; deviceCount: number }[];
}

export function VersionChartWrapper({ versions }: Props) {
  return <VersionChart versions={versions} />;
}
