"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type RAPIER from "@dimforge/rapier3d-compat";
import { GRAVITY } from "@blockverse/shared";

type RapierModule = typeof RAPIER;

type PhysicsContextValue = {
  RAPIER: RapierModule;
  world: RAPIER.World;
};

const PhysicsContext = createContext<PhysicsContextValue | null>(null);

export function usePhysics(): PhysicsContextValue {
  const ctx = useContext(PhysicsContext);
  if (!ctx) throw new Error("usePhysics must be used within <PhysicsProvider>");
  return ctx;
}

export function PhysicsProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<PhysicsContextValue | null>(null);

  useEffect(() => {
    let disposed = false;
    import("@dimforge/rapier3d-compat").then(async (RAPIER) => {
      await RAPIER.init();
      if (disposed) return;
      const world = new RAPIER.World({ x: 0, y: GRAVITY, z: 0 });
      setValue({ RAPIER, world });
    });
    return () => {
      disposed = true;
    };
  }, []);

  if (!value) return null;

  return <PhysicsContext.Provider value={value}>{children}</PhysicsContext.Provider>;
}
