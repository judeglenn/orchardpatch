/**
 * Simple in-memory store for agent data.
 * Shared across pages so device detail can find agent-sourced devices.
 */

import type { App, Device } from "./mockData";

type AgentStore = {
  apps: App[] | null;
  devices: Device[] | null;
  lastSync: string | null;
};

const store: AgentStore = {
  apps: null,
  devices: null,
  lastSync: null,
};

export function setAgentData(apps: App[], devices: Device[], lastSync: string) {
  store.apps = apps;
  store.devices = devices;
  store.lastSync = lastSync;
}

export function getAgentDevice(id: string): Device | undefined {
  return store.devices?.find((d) => d.id === id);
}

export function getAgentApp(id: string): App | undefined {
  return store.apps?.find((a) => a.id === id);
}

export function getAgentStore() {
  return store;
}
