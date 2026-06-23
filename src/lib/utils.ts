import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function getJobSummary(status: string, exitCode: number | null | undefined): string {
  if (status === "cancelled") return "Cancelled before execution";
  if (status === "queued") return "Waiting to be picked up by the agent";
  if (exitCode === 0) return "Patch completed successfully";
  if (exitCode === 23) return "App is managed by the Mac App Store. Installomator cannot patch MAS installs.";
  if (exitCode === 16) return "Download failed. Check network connectivity or try again.";
  if (exitCode === 11) return "Checksum mismatch. Downloaded file may be corrupted. Try again.";
  if (exitCode != null && exitCode !== 0) return `Patch failed (exit code ${exitCode}). See log for details.`;
  return "No details available.";
}

export function formatDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "--";
  const d = new Date(isoDate);
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} at ${time}`;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const AVATAR_COLORS = [
  "bg-[#2d5016]",
  "bg-[#1976D2]",
  "bg-[#0288D1]",
  "bg-[#0097A7]",
  "bg-[#00897B]",
  "bg-[#388E3C]",
  "bg-[#5E35B1]",
  "bg-[#8E24AA]",
  "bg-[#D81B60]",
  "bg-[#E64A19]",
  "bg-[#F57F17]",
  "bg-[#455A64]",
];

export function appColorClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const OS_NAMES: Record<string, string> = {
  "26": "Tahoe",
  "15": "Sequoia",
  "14": "Sonoma",
  "13": "Ventura",
  "12": "Monterey",
  "11": "Big Sur",
};

export function macOSName(version: string): string {
  const major = version.split(".")[0];
  return OS_NAMES[major] ?? "";
}

export function appInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

