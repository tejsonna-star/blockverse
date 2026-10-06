"use client";

import { useRouter } from "next/navigation";
import type { GameRegistryEntry } from "@/games/registry";

export function GameCard({ game }: { game: GameRegistryEntry }) {
  const router = useRouter();
  const liveCount = game.getLivePlayerCount();
  const isLive = liveCount > 0;

  return (
    <button
      onClick={() => router.push(game.route)}
      className="group relative flex flex-col text-left rounded-2xl bg-brand-panel border border-white/10 overflow-hidden
                 shadow-[0_0_0_rgba(0,0,0,0)] transition-all duration-200 ease-out
                 hover:-translate-y-1 hover:border-brand-accent/70 hover:shadow-[0_12px_32px_-8px_rgba(91,141,239,0.45)]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      <div
        className="relative h-40 flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(91,141,239,0.35), transparent 60%), linear-gradient(135deg, #1a2233 0%, #0d1119 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <span className="relative text-7xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:scale-110">
          {game.thumbnail}
        </span>

        {isLive && (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-[11px] font-semibold text-emerald-300 border border-emerald-400/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        )}

        <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-[11px] font-semibold text-white/80 border border-white/10">
          👥 {liveCount}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-1.5">
        <h3 className="text-base font-bold tracking-tight group-hover:text-brand-accent transition-colors">
          {game.title}
        </h3>
        <p className="text-xs text-white/50 leading-snug line-clamp-2">{game.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
            ✨ New
          </span>
          <span
            className="px-4 py-1.5 rounded-lg bg-brand-accent text-white text-xs font-bold tracking-wide
                       shadow-[0_2px_8px_rgba(91,141,239,0.5)] transition-transform duration-150 group-hover:scale-105"
          >
            PLAY
          </span>
        </div>
      </div>
    </button>
  );
}
