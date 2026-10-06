"use client";

import { useState } from "react";
import { WEAPONS, type WeaponId } from "@blockverse/shared";

export function Shop({
  coins,
  owned,
  equipped,
  onBuy,
  onEquip,
}: {
  coins: number;
  owned: Set<WeaponId>;
  equipped: WeaponId;
  onBuy: (id: WeaponId) => void;
  onEquip: (id: WeaponId) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-20 right-4 z-20 select-none" style={{ marginTop: "13rem" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-300 text-xs font-bold hover:bg-black/80 transition-colors"
      >
        🛒 Shop
        <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200">🪙 {coins}</span>
      </button>
      {open && (
        <div className="mt-2 w-72 max-h-[60vh] overflow-y-auto rounded-lg bg-black/70 border border-white/15 backdrop-blur-sm">
          <div className="px-3 py-2 text-[10px] font-bold tracking-widest text-white/50 border-b border-white/10 sticky top-0 bg-black/80">
            WEAPONS — 50 coins per kill
          </div>
          {WEAPONS.map((w) => {
            const isOwned = owned.has(w.id);
            const isEquipped = equipped === w.id;
            return (
              <div key={w.id} className="px-3 py-2.5 border-b border-white/5 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>{w.icon}</span>
                    {w.name}
                  </span>
                  {isEquipped ? (
                    <span className="text-[10px] font-bold text-emerald-400">EQUIPPED</span>
                  ) : isOwned ? (
                    <button
                      onClick={() => onEquip(w.id)}
                      className="px-2 py-0.5 rounded bg-brand-accent text-[10px] font-bold text-white hover:bg-blue-500"
                    >
                      Equip
                    </button>
                  ) : (
                    <button
                      onClick={() => onBuy(w.id)}
                      disabled={coins < w.cost}
                      className="px-2 py-0.5 rounded bg-amber-500 text-[10px] font-bold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400"
                    >
                      🪙 {w.cost}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-white/50 leading-snug">{w.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
