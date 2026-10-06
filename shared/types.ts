export type AvatarColors = {
  head: string;
  torso: string;
  arms: string;
  legs: string;
};

export const DEFAULT_AVATAR_COLORS: AvatarColors = {
  head: "#f2c48d",
  torso: "#2a6fdb",
  arms: "#f2c48d",
  legs: "#1f1f1f",
};

export type PlayerInput = {
  moveX: number; // -1..1
  moveZ: number; // -1..1
  jump: boolean;
  attack: boolean;
  lunge: boolean;
  lookYaw: number; // radians
  shiftLock: boolean;
  seq: number; // input sequence number for reconciliation
};

export type AnimState = "idle" | "walk" | "jump" | "fall" | "slash" | "lunge" | "death";

export type PlayerSnapshot = {
  id: string;
  username: string;
  colors: AvatarColors;
  position: { x: number; y: number; z: number };
  yaw: number;
  health: number;
  anim: AnimState;
  kills: number;
  deaths: number;
  streak: number;
};

// Room message shapes used by the Colyseus server from M3 onward.
export type RoomMessageType =
  | "input"
  | "chat"
  | "emote"
  | "duelInvite"
  | "duelAccept"
  | "killFeed";
