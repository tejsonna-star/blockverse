"use client";

export type KillFeedLine = { id: number; killer: string; victim: string };

export function KillFeed({ lines }: { lines: KillFeedLine[] }) {
  return (
    <div className="absolute top-20 left-6 z-10 flex flex-col gap-1 select-none pointer-events-none">
      {lines.map((l) => (
        <div
          key={l.id}
          className="px-2.5 py-1 rounded bg-black/50 border border-white/10 text-xs text-white/90 animate-[fadeIn_0.15s_ease-out]"
        >
          <span className="font-semibold">{l.killer}</span> <span className="text-red-400">⚔</span>{" "}
          <span className="font-semibold">{l.victim}</span>
        </div>
      ))}
    </div>
  );
}
