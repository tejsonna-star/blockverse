"use client";

import { useEffect, useRef, useState } from "react";
import { WEAPONS, ABILITY_COOLDOWN_MS, type WeaponId } from "@blockverse/shared";
import type { InputController } from "../InputController";

export type AbilityStatusRef = { current: { cooldownRemaining: number } };

export function AbilityButton({
  equipped,
  inputRef,
  statusRef,
}: {
  equipped: WeaponId;
  inputRef: React.RefObject<InputController | null>;
  statusRef: AbilityStatusRef;
}) {
  const [remaining, setRemaining] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      setRemaining(statusRef.current.cooldownRemaining);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [statusRef]);

  const weapon = WEAPONS.find((w) => w.id === equipped);
  const hasAbility = equipped !== "default";
  const totalSeconds = ABILITY_COOLDOWN_MS / 1000;
  const pct = remaining > 0 ? (remaining / totalSeconds) * 100 : 0;
  const ready = remaining <= 0;

  if (!hasAbility) return null;

  return (
    <button
      onClick={() => inputRef.current?.triggerAbility()}
      disabled={!ready}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-0.5 select-none touch-manipulation"
    >
      <div
        className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl overflow-hidden ${
          ready ? "border-brand-accent bg-black/60" : "border-white/20 bg-black/70"
        }`}
      >
        <span className={ready ? "" : "opacity-30"}>{weapon?.icon}</span>
        {!ready && (
          <div
            className="absolute inset-0 bg-black/60 flex items-center justify-center text-sm font-bold text-white"
            style={{ clipPath: `inset(${100 - pct}% 0 0 0)` }}
          />
        )}
        {!ready && (
          <span className="absolute text-sm font-bold text-white drop-shadow">{Math.ceil(remaining)}</span>
        )}
      </div>
      <span className="text-[9px] font-bold text-white/60 tracking-wide">E · ABILITY</span>
    </button>
  );
}
