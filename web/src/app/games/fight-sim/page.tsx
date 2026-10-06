"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MAX_HEALTH } from "@blockverse/shared";
import { authProvider } from "@/lib/session";
import { HealthBar } from "@/components/game/HUD/HealthBar";
import { Hotbar } from "@/components/game/HUD/Hotbar";
import { ChatBox } from "@/components/game/HUD/ChatBox";

const Scene = dynamic(() => import("@/components/game/Scene").then((m) => m.Scene), {
  ssr: false,
});

export default function FightSimPage() {
  const [swordEquipped, setSwordEquipped] = useState(true);
  const [username, setUsername] = useState("Guest");

  useEffect(() => {
    setUsername(authProvider.getCurrentUser()?.username ?? "Guest");
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      <Scene onEquipChange={setSwordEquipped} />
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 px-4 py-2 rounded-md bg-black/60 border border-white/15 text-sm hover:bg-black/80 transition-colors"
      >
        ← Back to Hub
      </Link>
      <HealthBar health={MAX_HEALTH} />
      <Hotbar swordEquipped={swordEquipped} />
      <ChatBox username={username} />
    </div>
  );
}
