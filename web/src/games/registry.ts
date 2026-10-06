export type GameRegistryEntry = {
  id: string;
  title: string;
  description: string;
  thumbnail: string; // path under /public, or an emoji fallback
  route: string;
  /** Replace with a real live-count feed once a game has a multiplayer server (M3). */
  getLivePlayerCount: () => number;
};

export const GAME_REGISTRY: GameRegistryEntry[] = [
  {
    id: "number-ninja",
    title: "Number Ninja",
    description: "Fast-paced arithmetic practice. Sharpen your mental math against the clock.",
    thumbnail: "🔢",
    route: "/games/number-ninja",
    getLivePlayerCount: () => 0,
  },
];

export function getTotalPlayersOnline(): number {
  return GAME_REGISTRY.reduce((sum, g) => sum + g.getLivePlayerCount(), 0);
}
