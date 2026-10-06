"use client";

export function Hotbar({ swordEquipped }: { swordEquipped: boolean }) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 select-none">
      <div
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border-2 text-2xl transition-colors ${
          swordEquipped
            ? "bg-brand-accent/30 border-brand-accent"
            : "bg-black/50 border-white/15"
        }`}
      >
        ⚔️
        <span className="absolute mt-9 text-[9px] text-white/50">1</span>
      </div>
    </div>
  );
}
