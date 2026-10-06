"use client";

import { useEffect, useRef, useState } from "react";
import type { InputController } from "../InputController";

const JOYSTICK_RADIUS = 50;

export function MobileControls({ inputRef }: { inputRef: React.RefObject<InputController | null> }) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activeTouch = useRef<number | null>(null);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (!isTouchDevice) return null;

  function handleStart(e: React.TouchEvent) {
    const touch = e.changedTouches[0];
    activeTouch.current = touch.identifier;
    updateKnob(touch.clientX, touch.clientY);
  }

  function handleMove(e: React.TouchEvent) {
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === activeTouch.current) {
        updateKnob(touch.clientX, touch.clientY);
      }
    }
  }

  function handleEnd(e: React.TouchEvent) {
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === activeTouch.current) {
        activeTouch.current = null;
        setKnob({ x: 0, y: 0 });
        inputRef.current?.setVirtualMove(0, 0);
      }
    }
  }

  function updateKnob(clientX: number, clientY: number) {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_RADIUS) {
      dx = (dx / dist) * JOYSTICK_RADIUS;
      dy = (dy / dist) * JOYSTICK_RADIUS;
    }
    setKnob({ x: dx, y: dy });
    // Screen-space joystick: up (negative dy) = forward (negative z).
    inputRef.current?.setVirtualMove(dx / JOYSTICK_RADIUS, dy / JOYSTICK_RADIUS);
  }

  return (
    <>
      <div
        ref={baseRef}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
        className="absolute bottom-28 left-8 z-20 w-28 h-28 rounded-full bg-white/10 border border-white/25 touch-none select-none"
      >
        <div
          className="absolute w-12 h-12 rounded-full bg-white/40 border border-white/50"
          style={{
            left: `calc(50% + ${knob.x}px - 1.5rem)`,
            top: `calc(50% + ${knob.y}px - 1.5rem)`,
          }}
        />
      </div>
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          inputRef.current?.setVirtualJump(true);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          inputRef.current?.setVirtualJump(false);
        }}
        className="absolute bottom-40 right-8 z-20 w-16 h-16 rounded-full bg-white/15 border border-white/30 text-xs font-bold text-white touch-none select-none"
      >
        JUMP
      </button>
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          inputRef.current?.triggerAttack();
        }}
        className="absolute bottom-20 right-8 z-20 w-16 h-16 rounded-full bg-brand-accent/70 border border-brand-accent text-xs font-bold text-white touch-none select-none"
      >
        ⚔️
      </button>
    </>
  );
}
