"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type FleetStatsState =
  | { status: "loading" }
  | { status: "has-devices"; totalDevices: number; totalApps: number }
  | { status: "no-devices" }
  | { status: "unreachable" };

const FleetStatsContext = createContext<FleetStatsState>({ status: "loading" });

export function FleetStatsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FleetStatsState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) {
          setState({ status: "unreachable" });
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.totalDevices > 0) {
          setState({ status: "has-devices", totalDevices: data.totalDevices, totalApps: data.totalApps });
        } else {
          setState({ status: "no-devices" });
        }
      })
      .catch(() => setState({ status: "unreachable" }));
  }, []);

  return (
    <FleetStatsContext.Provider value={state}>
      {children}
    </FleetStatsContext.Provider>
  );
}

export function useFleetStats(): FleetStatsState {
  return useContext(FleetStatsContext);
}
