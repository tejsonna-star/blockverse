"use client";

import { AvatarColors, DEFAULT_AVATAR_COLORS } from "@blockverse/shared";

const USERNAME_KEY = "blockverse.username";
const AVATAR_KEY = "blockverse.avatarColors";

export type CurrentUser = {
  username: string;
  colors: AvatarColors;
};

/**
 * Swappable auth boundary. v1 is pure sessionStorage (guest-only, no DB).
 * A future real-account implementation can satisfy this same interface
 * without touching any calling code.
 */
export interface AuthProvider {
  getCurrentUser(): CurrentUser | null;
  login(username: string): CurrentUser;
  logout(): void;
}

class SessionAuthProvider implements AuthProvider {
  getCurrentUser(): CurrentUser | null {
    if (typeof window === "undefined") return null;
    const username = window.sessionStorage.getItem(USERNAME_KEY);
    if (!username) return null;
    return { username, colors: getAvatarColors() };
  }

  login(username: string): CurrentUser {
    window.sessionStorage.setItem(USERNAME_KEY, username);
    return { username, colors: getAvatarColors() };
  }

  logout(): void {
    window.sessionStorage.removeItem(USERNAME_KEY);
  }
}

export const authProvider: AuthProvider = new SessionAuthProvider();

export function getAvatarColors(): AvatarColors {
  if (typeof window === "undefined") return DEFAULT_AVATAR_COLORS;
  const raw = window.sessionStorage.getItem(AVATAR_KEY);
  if (!raw) return DEFAULT_AVATAR_COLORS;
  try {
    return { ...DEFAULT_AVATAR_COLORS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AVATAR_COLORS;
  }
}

export function saveAvatarColors(colors: AvatarColors): void {
  window.sessionStorage.setItem(AVATAR_KEY, JSON.stringify(colors));
}
