"use client";

import { useState } from "react";

export function UsernamePrompt({ onSubmit }: { onSubmit: (username: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = value.trim();
    if (trimmed.length < 3 || trimmed.length > 16) {
      setError("Username must be 3-16 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError("Letters, numbers, and underscores only.");
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-brand-panel border border-white/10 rounded-xl p-6 w-80 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Pick a username</h2>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Guest_1234"
          className="px-3 py-2 rounded-md bg-black/30 border border-white/10 outline-none focus:border-brand-accent"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={submit}
          className="px-4 py-2 rounded-md bg-brand-accent font-medium hover:bg-blue-500 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
