"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AvatarColors } from "@blockverse/shared";
import { PLATFORM_NAME } from "@/lib/platformConfig";
import { authProvider, getAvatarColors, type CurrentUser } from "@/lib/session";
import { GAME_REGISTRY, getTotalPlayersOnline } from "@/games/registry";
import { GameCard } from "@/components/hub/GameCard";
import { UsernamePrompt } from "@/components/hub/UsernamePrompt";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const [avatarColors, setAvatarColors] = useState<AvatarColors | null>(null);

  useEffect(() => {
    setUser(authProvider.getCurrentUser());
    setAvatarColors(getAvatarColors());
  }, []);

  function handleUsername(username: string) {
    setUser(authProvider.login(username));
  }

  if (user === undefined) {
    return null; // avoid session-storage flash on first paint
  }

  if (user === null) {
    return <UsernamePrompt onSubmit={handleUsername} />;
  }

  const flagship = GAME_REGISTRY[0];
  const totalOnline = getTotalPlayersOnline();

  return (
    <main className="min-h-screen bg-brand-bg">
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-8 py-4 border-b border-white/10 bg-brand-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent text-white font-black text-sm shadow-[0_0_16px_rgba(91,141,239,0.5)]">
            B
          </span>
          <h1 className="text-xl font-black tracking-wide">{PLATFORM_NAME}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/70">
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {totalOnline} online
          </span>
          <Link
            href="/avatar"
            className="px-3 py-1.5 rounded-full border border-white/10 hover:border-brand-accent/60 hover:text-white transition-colors"
          >
            🎨 Avatar
          </Link>
          <span className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span
              className="h-5 w-5 rounded-full border border-white/20"
              style={{ backgroundColor: avatarColors?.torso ?? "#2a6fdb" }}
            />
            <span className="font-medium text-white">{user.username}</span>
          </span>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 md:px-8 py-12 md:py-16 border-b border-white/5">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(91,141,239,0.35), transparent 55%), radial-gradient(circle at 85% 80%, rgba(91,141,239,0.2), transparent 50%)",
          }}
        />
        <div className="relative max-w-3xl">
          <span className="inline-block px-3 py-1 mb-4 rounded-full bg-brand-accent/15 border border-brand-accent/40 text-brand-accent text-xs font-bold tracking-widest uppercase">
            Now Live
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Grab a sword. Pick a server.
            <br />
            <span className="text-brand-accent">Fight everyone.</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-xl">
            {flagship.description} Jump into {PLATFORM_NAME} and swing into the action — no queue, no lobby.
          </p>
          <button
            onClick={() => router.push(flagship.route)}
            className="mt-6 px-6 py-3 rounded-xl bg-brand-accent text-white font-bold tracking-wide shadow-[0_8px_24px_-6px_rgba(91,141,239,0.6)] hover:scale-[1.03] active:scale-100 transition-transform"
          >
            ⚔ Play {flagship.title}
          </button>
        </div>
      </section>

      <section className="px-6 md:px-8 py-10">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-sm uppercase tracking-widest text-white/40">Games</h2>
          <span className="text-xs text-white/30">{GAME_REGISTRY.length} available</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {GAME_REGISTRY.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </main>
  );
}
