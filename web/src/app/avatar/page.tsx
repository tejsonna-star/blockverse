"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AvatarColors } from "@blockverse/shared";
import { getAvatarColors, saveAvatarColors } from "@/lib/session";

const AvatarPreview = dynamic(() => import("@/components/game/AvatarPreview").then((m) => m.AvatarPreview), {
  ssr: false,
});

const PARTS: { key: keyof AvatarColors; label: string }[] = [
  { key: "head", label: "Head" },
  { key: "torso", label: "Torso" },
  { key: "arms", label: "Arms" },
  { key: "legs", label: "Legs" },
];

export default function AvatarPage() {
  const [colors, setColors] = useState<AvatarColors | null>(null);

  useEffect(() => {
    setColors(getAvatarColors());
  }, []);

  function updateColor(key: keyof AvatarColors, value: string) {
    setColors((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      saveAvatarColors(next);
      return next;
    });
  }

  if (!colors) return null;

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <h1 className="text-xl font-bold">Customize Avatar</h1>
        <Link href="/" className="text-sm text-white/70 hover:text-white underline-offset-4 hover:underline">
          ← Back to Hub
        </Link>
      </header>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
        <div className="rounded-xl overflow-hidden border border-white/10 h-[420px] md:h-full">
          <AvatarPreview colors={colors} />
        </div>
        <div className="flex flex-col gap-5">
          {PARTS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between bg-brand-panel border border-white/10 rounded-lg px-4 py-3">
              <span className="text-sm font-medium">{label}</span>
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => updateColor(key, e.target.value)}
                className="w-12 h-8 rounded cursor-pointer bg-transparent border border-white/20"
              />
            </div>
          ))}
          <p className="text-xs text-white/40">Changes save automatically and apply next time you spawn.</p>
        </div>
      </div>
    </main>
  );
}
