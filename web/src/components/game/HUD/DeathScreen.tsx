"use client";

import { useEffect, useState } from "react";
import { RESPAWN_DELAY_MS } from "@blockverse/shared";

export function DeathScreen({ visible, killerName }: { visible: boolean; killerName?: string | null }) {
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(RESPAWN_DELAY_MS / 1000));

  useEffect(() => {
    if (!visible) return;
    setSecondsLeft(Math.ceil(RESPAWN_DELAY_MS / 1000));
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-red-950/60 backdrop-blur-sm">
      <div className="text-center select-none">
        <h1 className="text-5xl font-black text-red-400 tracking-wide drop-shadow-[0_0_20px_rgba(248,113,113,0.5)]">
          YOU DIED
        </h1>
        {killerName && (
          <p className="mt-3 text-lg text-white/70">
            Killed by <span className="font-bold text-white">{killerName}</span>
          </p>
        )}
        <p className="mt-6 text-sm font-semibold text-white/50 tracking-widest uppercase">
          Respawning in {secondsLeft}...
        </p>
      </div>
    </div>
  );
}
