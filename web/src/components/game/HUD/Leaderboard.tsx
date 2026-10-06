"use client";

export type LeaderboardEntry = {
  id: string;
  username: string;
  kills: number;
  deaths: number;
  streak: number;
  isSelf: boolean;
};

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const sorted = [...entries].sort((a, b) => b.kills - a.kills);
  return (
    <div className="absolute top-20 right-4 z-10 w-56 select-none rounded-lg bg-black/50 border border-white/10 overflow-hidden">
      <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest text-white/50 border-b border-white/10">
        LEADERBOARD
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-3 py-1 text-[10px] text-white/40">
        <span>Player</span>
        <span>K</span>
        <span>D</span>
        <span>S</span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {sorted.map((e) => (
          <div
            key={e.id}
            className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-3 py-1 text-xs ${
              e.isSelf ? "bg-brand-accent/20 text-white" : "text-white/80"
            }`}
          >
            <span className="truncate">{e.username}</span>
            <span className="w-4 text-right">{e.kills}</span>
            <span className="w-4 text-right">{e.deaths}</span>
            <span className="w-4 text-right">{e.streak}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
