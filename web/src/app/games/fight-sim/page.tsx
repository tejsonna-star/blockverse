"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const Scene = dynamic(() => import("@/components/game/Scene").then((m) => m.Scene), {
  ssr: false,
});

export default function FightSimPage() {
  return (
    <div className="fixed inset-0 bg-black">
      <Scene />
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 px-4 py-2 rounded-md bg-black/60 border border-white/15 text-sm hover:bg-black/80 transition-colors"
      >
        ← Back to Hub
      </Link>
    </div>
  );
}
