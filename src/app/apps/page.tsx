"use client";
import dynamic from "next/dynamic";

const HomePageInner = dynamic(() => import("@/components/HomePageInner"), { ssr: false });

export default function AppsPage() {
  return <HomePageInner />;
}
