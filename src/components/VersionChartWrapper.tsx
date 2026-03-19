"use client";

import dynamic from "next/dynamic";

const VersionChart = dynamic(() => import("@/components/VersionChart").then(m => m.VersionChart), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-[#2d5016] border-t-transparent animate-spin" />
    </div>
  ),
});

interface Props {
  versions: { version: string; deviceCount: number }[];
}

export function VersionChartWrapper({ versions }: Props) {
  return <VersionChart versions={versions} />;
}
