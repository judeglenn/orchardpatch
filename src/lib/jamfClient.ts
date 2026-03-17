/**
 * jamfClient.ts
 *
 * Unified interface that switches between mock data and a real Jamf Pro API
 * depending on the USE_MOCK_DATA environment variable (default: true).
 *
 * To connect to a real Jamf Pro instance, set:
 *   USE_MOCK_DATA=false
 *   JAMF_PRO_URL=https://yourinstance.jamfcloud.com
 *   JAMF_API_CLIENT_ID=<oauth client id>
 *   JAMF_API_CLIENT_SECRET=<oauth client secret>
 */

import {
  apps,
  devices,
  getAppById,
  getAppInstallations,
  getDeviceById,
  stats,
  type App,
  type AppInstallation,
  type Device,
} from "@/lib/mockData";

const USE_MOCK = process.env.USE_MOCK_DATA !== "false";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { App, AppInstallation, Device };

export interface AppListResult {
  apps: App[];
  total: number;
}

export interface AppDetailResult {
  app: App;
  installations: AppInstallation[];
}

export interface DeviceDetailResult {
  device: Device;
}

// ─── Client ───────────────────────────────────────────────────────────────────

async function getJamfToken(): Promise<string> {
  const url = `${process.env.JAMF_PRO_URL}/api/oauth/token`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.JAMF_API_CLIENT_ID ?? "",
      client_secret: process.env.JAMF_API_CLIENT_SECRET ?? "",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Jamf auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listApps(): Promise<AppListResult> {
  if (USE_MOCK) {
    return { apps, total: apps.length };
  }

  // Real Jamf Pro implementation placeholder
  const token = await getJamfToken();
  const res = await fetch(`${process.env.JAMF_PRO_URL}/api/v1/apps`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Jamf API error: ${res.status}`);
  const data = await res.json();
  // Transform Jamf Pro response to our App type here
  return { apps: data.results, total: data.totalCount };
}

export async function getApp(id: string): Promise<AppDetailResult | null> {
  if (USE_MOCK) {
    const app = getAppById(id);
    if (!app) return null;
    const installations = getAppInstallations(id);
    return { app, installations };
  }

  const token = await getJamfToken();
  const res = await fetch(`${process.env.JAMF_PRO_URL}/api/v1/apps/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Jamf API error: ${res.status}`);
  const data = await res.json();
  return { app: data, installations: data.installations ?? [] };
}

export async function getDevice(id: string): Promise<DeviceDetailResult | null> {
  if (USE_MOCK) {
    const device = getDeviceById(id);
    if (!device) return null;
    return { device };
  }

  const token = await getJamfToken();
  const res = await fetch(`${process.env.JAMF_PRO_URL}/api/v1/computers-preview/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Jamf API error: ${res.status}`);
  const data = await res.json();
  return { device: data };
}

export async function getStats() {
  if (USE_MOCK) return stats;

  // Real implementation would fetch aggregate data
  const token = await getJamfToken();
  const res = await fetch(`${process.env.JAMF_PRO_URL}/api/v1/dashboards`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Jamf API error: ${res.status}`);
  return res.json();
}
