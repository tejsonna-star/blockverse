"use client";

import { MAX_HEALTH } from "@blockverse/shared";

export function HealthBar({ health = MAX_HEALTH }: { health?: number }) {
  const pct = Math.max(0, Math.min(100, (health / MAX_HEALTH) * 100));
  return (
    <div className="absolute bottom-6 left-6 z-10 w-48 select-none">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] font-bold text-white/80 tracking-wide">HEALTH</span>
        <span className="text-[11px] font-semibold text-white/60">
          {health}/{MAX_HEALTH}
        </span>
      </div>
      <div className="h-3 rounded-full bg-black/50 border border-white/15 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
