"use client";

import { useEffect, useRef, useState } from "react";

export type ChatLine = { id: number; username: string; text: string };

export function ChatBox({ messages, onSend }: { messages: ChatLine[]; onSend: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Enter" && !open) {
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Pointer lock (shift-lock) blocks focus/typing on form elements in
    // most browsers, so drop it before handing focus to the chat input.
    // exitPointerLock is asynchronous, so defer the focus a tick.
    if (document.pointerLockElement) document.exitPointerLock();
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  function send() {
    const trimmed = draft.trim();
    if (trimmed) onSend(trimmed);
    setDraft("");
    setOpen(false);
  }

  return (
    <div className="absolute bottom-24 left-6 z-10 w-72 select-none">
      <div className="flex flex-col gap-1 mb-2 max-h-36 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="text-xs drop-shadow">
            <span className={m.username === "SYSTEM" ? "text-amber-300/90" : "text-brand-accent font-semibold"}>
              {m.username}:
            </span>{" "}
            <span className="text-white/90">{m.text}</span>
          </div>
        ))}
      </div>
      {open ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") send();
            if (e.key === "Escape") {
              setDraft("");
              setOpen(false);
            }
          }}
          onKeyUp={(e) => e.stopPropagation()}
          maxLength={120}
          placeholder="Say something..."
          className="w-full px-2 py-1.5 rounded-md bg-black/60 border border-white/20 text-sm text-white outline-none focus:border-brand-accent"
        />
      ) : (
        <div className="text-[11px] text-white/40">Press Enter to chat</div>
      )}
    </div>
  );
}
