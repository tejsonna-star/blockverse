"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MAX_HEALTH, COINS_PER_KILL, RESPAWN_DELAY_MS, WEAPONS, type AvatarColors, type WeaponId } from "@blockverse/shared";
import { authProvider, getAvatarColors } from "@/lib/session";
import { AccountGate } from "@/components/hub/AccountGate";
import { HealthBar } from "@/components/game/HUD/HealthBar";
import { Hotbar } from "@/components/game/HUD/Hotbar";
import { ChatBox, type ChatLine } from "@/components/game/HUD/ChatBox";
import { Leaderboard, type LeaderboardEntry } from "@/components/game/HUD/Leaderboard";
import { KillFeed, type KillFeedLine } from "@/components/game/HUD/KillFeed";
import { DeathScreen } from "@/components/game/HUD/DeathScreen";
import { Shop } from "@/components/game/HUD/Shop";
import { AbilityButton } from "@/components/game/HUD/AbilityButton";
import { MobileControls } from "@/components/game/HUD/MobileControls";
import { NetworkClient } from "@/components/game/NetworkClient";
import type { InputController } from "@/components/game/InputController";

const Scene = dynamic(() => import("@/components/game/Scene").then((m) => m.Scene), {
  ssr: false,
});

let chatId = 1;
let killFeedId = 1;

type ConnectionStatus = "connecting" | "connected" | "offline";

export default function NumberNinjaPage() {
  const [swordEquipped, setSwordEquipped] = useState(true);
  const [username, setUsername] = useState("Guest");
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [messages, setMessages] = useState<ChatLine[]>([
    { id: chatId++, username: "SYSTEM", text: "Connecting to server..." },
  ]);
  const [killFeed, setKillFeed] = useState<KillFeedLine[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selfHealth, setSelfHealth] = useState(MAX_HEALTH);
  const [deathInfo, setDeathInfo] = useState<{ killer: string } | null>(null);
  const [panicking, setPanicking] = useState(false);
  const [coins, setCoins] = useState(0);
  const [ownedWeapons, setOwnedWeapons] = useState<Set<WeaponId>>(new Set(["default"]));
  const [equippedWeapon, setEquippedWeapon] = useState<WeaponId>("default");

  const network = useMemo(() => new NetworkClient(), []);
  const networkRef = useRef(network);
  networkRef.current = network;
  const inputRef = useRef<InputController | null>(null);
  const abilityStatusRef = useRef({ cooldownRemaining: 0 });

  useEffect(() => {
    const user = authProvider.getCurrentUser();
    const name = user?.username ?? "Guest";
    setUsername(name);
    const colors: AvatarColors = getAvatarColors();

    let cancelled = false;
    network.connect(name, colors).then((ok) => {
      if (cancelled) return;
      setStatus(ok ? "connected" : "offline");
      setMessages((prev) => [
        ...prev,
        {
          id: chatId++,
          username: "SYSTEM",
          text: ok ? "Connected. You're playing live!" : "Couldn't reach the game server — playing offline.",
        },
      ]);
    });

    const unsubPlayers = network.onPlayersChange((players) => {
      const entries: LeaderboardEntry[] = Array.from(players.entries()).map(([id, p]) => ({
        id,
        username: p.username,
        kills: p.kills,
        deaths: p.deaths,
        streak: p.streak,
        isSelf: id === network.sessionId,
      }));
      setLeaderboard(entries);

      const self = network.sessionId ? players.get(network.sessionId) : undefined;
      if (self) setSelfHealth(self.health);
    });

    const unsubChat = network.onChat((msg) => {
      setMessages((prev) => [...prev.slice(-19), { id: chatId++, username: msg.username, text: msg.text }]);
    });

    const unsubKillFeed = network.onKillFeed((msg) => {
      const id = killFeedId++;
      setKillFeed((prev) => [...prev.slice(-4), { id, killer: msg.killer, victim: msg.victim }]);
      setTimeout(() => {
        setKillFeed((prev) => prev.filter((l) => l.id !== id));
      }, 5000);
      if (msg.killer === name) {
        setCoins((c) => c + COINS_PER_KILL);
      }
      if (msg.victim === name) {
        setDeathInfo({ killer: msg.killer });
        setTimeout(() => setDeathInfo(null), RESPAWN_DELAY_MS);
      }
    });

    return () => {
      cancelled = true;
      unsubPlayers();
      unsubChat();
      unsubKillFeed();
      network.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key.toLowerCase() === "k") {
        // Cover the screen instantly so the game doesn't keep visibly
        // simulating/animating during the brief window before the
        // browser actually finishes navigating away.
        setPanicking(true);
        window.location.href = "https://www.khanacademy.org/math";
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (panicking) {
    // Unmount the whole game (including the Canvas render loop) instantly
    // instead of just covering it, so nothing keeps animating underneath
    // while the browser finishes navigating away.
    return <div className="fixed inset-0 z-50 bg-white" />;
  }

  return (
    <AccountGate>
    <div className="fixed inset-0 bg-black">
      <Scene
        network={network}
        equippedWeapon={equippedWeapon}
        inputRef={inputRef}
        abilityStatusRef={abilityStatusRef}
        onEquipChange={setSwordEquipped}
        onDummyKilled={() => setCoins((c) => c + COINS_PER_KILL)}
        onAbilityUsed={(weapon, hitSomething) => {
          const w = WEAPONS.find((x) => x.id === weapon);
          const suffix = hitSomething ? "" : " (no one in range)";
          setMessages((prev) => [
            ...prev.slice(-19),
            { id: chatId++, username: "SYSTEM", text: `${w?.icon ?? ""} ${w?.name ?? weapon} activated!${suffix}` },
          ]);
        }}
        onLocalHit={(targetName) => {
          setMessages((prev) => [
            ...prev.slice(-19),
            { id: chatId++, username: "SYSTEM", text: `⚔ Hit ${targetName}!` },
          ]);
        }}
      />
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 px-4 py-2 rounded-md bg-black/60 border border-white/15 text-sm hover:bg-black/80 transition-colors"
      >
        ← Back to Hub
      </Link>
      <span
        className={`absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
          status === "connected"
            ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
            : status === "connecting"
              ? "bg-white/10 border-white/20 text-white/60"
              : "bg-red-500/15 border-red-400/40 text-red-300"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === "connected" ? "bg-emerald-400 animate-pulse" : status === "connecting" ? "bg-white/50" : "bg-red-400"
          }`}
        />
        {status === "connected" ? "Live" : status === "connecting" ? "Connecting..." : "Offline"}
      </span>
      <HealthBar health={selfHealth} />
      <DeathScreen visible={!!deathInfo} killerName={deathInfo?.killer} />
      <Hotbar swordEquipped={swordEquipped} />
      <AbilityButton equipped={equippedWeapon} inputRef={inputRef} statusRef={abilityStatusRef} />
      <MobileControls inputRef={inputRef} />
      <ChatBox messages={messages} onSend={(text) => networkRef.current.sendChat(text)} />
      <Leaderboard entries={leaderboard} />
      <KillFeed lines={killFeed} />
      <Shop
        coins={coins}
        owned={ownedWeapons}
        equipped={equippedWeapon}
        onBuy={(id) => {
          const weapon = WEAPONS.find((w) => w.id === id);
          if (!weapon || coins < weapon.cost || ownedWeapons.has(id)) return;
          setCoins((c) => c - weapon.cost);
          setOwnedWeapons((prev) => new Set(prev).add(id));
        }}
        onEquip={(id) => setEquippedWeapon(id)}
      />
    </div>
    </AccountGate>
  );
}
