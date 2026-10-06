/**
 * Single source of truth for every tunable number in BLOCKVERSE.
 * Change gameplay feel here — nothing else should hardcode these values.
 */

export const PLATFORM_NAME = "BLOCKVERSE";

// ---------- Avatar / world scale ----------
// 1 "stud" = 1 three.js/Rapier world unit.
export const STUD = 1;

export const RIG = {
  headSize: 1.2 * STUD,
  torso: { x: 2 * STUD, y: 2 * STUD, z: 1 * STUD },
  limb: { x: 1 * STUD, y: 2 * STUD, z: 1 * STUD },
};

// ---------- Movement ----------
export const WALK_SPEED = 16 * STUD; // studs/sec
export const RUN_MULTIPLIER = 1; // reserved for future sprint mechanic
export const JUMP_POWER = 52; // initial upward velocity, studs/sec
export const GRAVITY = -196.2; // studs/sec^2 — classic floaty-blocky feel, yields ~7 stud jump height
export const CHARACTER_CAPSULE = {
  radius: 1 * STUD,
  halfHeight: 1.5 * STUD, // capsule half-height excluding the two radii caps
};

// ---------- Camera ----------
export const CAMERA = {
  minZoom: 2, // first-person kicks in at/under this distance
  maxZoom: 40,
  defaultZoom: 14,
  shiftLockShoulderOffset: { x: 1.6, y: 0.3 },
  orbitSensitivity: 0.0035,
  zoomSensitivity: 1.2,
};

// ---------- Servers / matchmaking (used from M3) ----------
export const MAX_PLAYERS_PER_SERVER = 30;
export const PRIVATE_SERVER_CODE_LENGTH = 6;
export const SERVER_TICK_RATE_HZ = 24; // server authoritative sim tick (20-30Hz range)
export const CLIENT_RENDER_FPS_TARGET = 60;
export const LAG_COMPENSATION_MAX_MS = 200;
export const RECONNECT_WINDOW_MS = 30_000;

// ---------- Combat (used from M2) ----------
export const MAX_HEALTH = 100;
export const DAMAGE = {
  slash: 25,
  lunge: 30,
  touch: 5,
};
export const SWORD_RANGE = 6; // studs, slash hit distance from player center
export const SWORD_ARC_DEGREES = 180; // forward-facing hit cone
export const ATTACK_COOLDOWN_MS = 500;
export const LUNGE_DOUBLE_CLICK_WINDOW_MS = 200;
export const LUNGE_FORWARD_BOOST = 10; // studs/sec impulse applied on lunge
export const KNOCKBACK_IMPULSE = 6;
export const TOUCH_DAMAGE_COOLDOWN_MS = 1000; // per-target cooldown for contact damage
export const RESPAWN_DELAY_MS = 3000;
export const SPAWN_PROTECTION_MS = 3000;

// ---------- Shop / weapons (used from M4) ----------
export const COINS_PER_KILL = 50;
export type WeaponId = "default" | "fartblast" | "flash" | "snow";
export type WeaponDef = {
  id: WeaponId;
  name: string;
  icon: string;
  cost: number;
  description: string;
};
export const WEAPONS: WeaponDef[] = [
  { id: "default", name: "Default", icon: "⚔️", cost: 0, description: "Classic sword, 25 damage. No special ability." },
  {
    id: "fartblast",
    name: "Fart Blast",
    icon: "💨",
    cost: 100,
    description: "Sword (25 dmg). Ability (E): pushes nearby players away with a small explosion.",
  },
  {
    id: "flash",
    name: "Flash",
    icon: "⚡",
    cost: 200,
    description: "Sword (25 dmg). Ability (E): instantly teleports you forward.",
  },
  {
    id: "snow",
    name: "Snow",
    icon: "❄️",
    cost: 300,
    description: "Sword (25 dmg). Ability (E): freezes the nearest target in front of you, slowing them.",
  },
];
export const KNOCKBACK_SPEED = 28; // studs/sec impulse applied by Fart Blast
export const KNOCKBACK_DURATION_MS = 350;
export const FLASH_DISTANCE = 16; // studs
export const ABILITY_COOLDOWN_MS = 5000;
export const ABILITY_RANGE = 10; // studs — fartblast AOE radius / snow target search range
export const SLOW_MULTIPLIER = 0.4;
export const SLOW_DURATION_MS = 3000;

// ---------- Duels (used from M4) ----------
export const DUEL_ROUNDS_TO_WIN = 3;
export const DUEL_COUNTDOWN_SECONDS = 3;
export const DUEL_PAD_PAIR_COUNT = 4;

// ---------- Anti-cheat (used from M4) ----------
export const MAX_SPEED_TOLERANCE = 1.25; // multiplier over WALK_SPEED before flagged
export const ATTACK_RATE_LIMIT_PER_SEC = 6;
export const CHAT_RATE_LIMIT_PER_SEC = 3;
