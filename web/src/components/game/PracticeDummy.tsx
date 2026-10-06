"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { MAX_HEALTH, RESPAWN_DELAY_MS } from "@blockverse/shared";
import { CharacterRig, CHARACTER_HEIGHT } from "./CharacterRig";

export const DUMMY_POSITION = new THREE.Vector3(6, 0, -3);

export type DummyHandle = {
  takeDamage: (amount: number) => void;
  isAlive: () => boolean;
};

const DUMMY_COLORS = { head: "#c9a227", torso: "#5a5a5a", arms: "#5a5a5a", legs: "#333333" };

export const PracticeDummy = forwardRef<DummyHandle>(function PracticeDummy(_props, ref) {
  const [health, setHealth] = useState(MAX_HEALTH);
  const respawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const healthRef = useRef(health);
  healthRef.current = health;

  useImperativeHandle(
    ref,
    () => ({
      takeDamage(amount: number) {
        if (healthRef.current <= 0) return;
        const next = Math.max(0, healthRef.current - amount);
        setHealth(next);
        if (next === 0) {
          respawnTimer.current = setTimeout(() => setHealth(MAX_HEALTH), RESPAWN_DELAY_MS);
        }
      },
      isAlive() {
        return healthRef.current > 0;
      },
    }),
    []
  );

  useEffect(() => {
    return () => {
      if (respawnTimer.current) clearTimeout(respawnTimer.current);
    };
  }, []);

  const alive = health > 0;
  const pct = Math.round((health / MAX_HEALTH) * 100);

  return (
    <group position={DUMMY_POSITION} visible={alive}>
      <CharacterRig colors={DUMMY_COLORS} />
      <Html position={[0, CHARACTER_HEIGHT + 0.7, 0]} center distanceFactor={10} occlude>
        <div className="flex flex-col items-center gap-0.5 select-none pointer-events-none">
          <span className="text-[10px] font-semibold text-white/90 drop-shadow">Dummy</span>
          <div className="w-16 h-1.5 rounded-full bg-black/50 overflow-hidden border border-white/20">
            <div
              className="h-full bg-red-500 transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
});
