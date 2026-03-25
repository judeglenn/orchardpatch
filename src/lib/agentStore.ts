/**
 * Simple in-memory store for agent data.
 * Shared across pages so device detail can find agent-sourced devices.
 */

import type { App, Device } from "./mockData";

// Extended app type with latest version info from agent
export type AppWithVersion = App & {
  latestVersion?: string | null;
};

type AgentStore = {
  apps: AppWithVersion[] | null;
  devices: Device[] | null;
  lastSync: string | null;
  latestVersions: Record<string, string>; // bundleId → latest version
};

const store: AgentStore = {
  apps: null,
  devices: null,
  lastSync: null,
  latestVersions: {},
};

export function setAgentData(apps: AppWithVersion[], devices: Device[], lastSync: string) {
  store.apps = apps;
  store.devices = devices;
  store.lastSync = lastSync;

  // Build latestVersions lookup from app data
  for (const app of apps) {
    if (app.latestVersion) {
      store.latestVersions[app.bundleId] = app.latestVersion;
    }
  }
}

export function getAgentDevice(id: string): Device | undefined {
  return store.devices?.find((d) => d.id === id);
}

export function getAgentApp(id: string): AppWithVersion | undefined {
  return store.apps?.find((a) => a.id === id);
}

export function getLatestVersion(bundleId: string): string | null {
  return store.latestVersions[bundleId] ?? null;
}

export function getAgentStore() {
  return store;
}
