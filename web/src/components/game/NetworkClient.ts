import { Client, Room } from "colyseus.js";
import { GAME_SERVER_URL } from "@/lib/platformConfig";
import type { AvatarColors, WeaponId } from "@blockverse/shared";

export type RemotePlayer = {
  id: string;
  username: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  anim: string;
  health: number;
  kills: number;
  deaths: number;
  streak: number;
  spawnProtected: boolean;
  colors: AvatarColors;
};

export type ChatEvent = { username: string; text: string };
export type KillFeedEvent = { killer: string; victim: string };
export type HitEffectEvent = { targetId: string; type: "knockback" | "slow"; dirX?: number; dirZ?: number };

function toRemotePlayer(id: string, p: any): RemotePlayer {
  return {
    id,
    username: p.username,
    x: p.x,
    y: p.y,
    z: p.z,
    yaw: p.yaw,
    anim: p.anim,
    health: p.health,
    kills: p.kills,
    deaths: p.deaths,
    streak: p.streak,
    spawnProtected: p.spawnProtected,
    colors: { head: p.headColor, torso: p.torsoColor, arms: p.armsColor, legs: p.legsColor },
  };
}

/**
 * Thin wrapper around a Colyseus room with a small pub-sub layer, since
 * both the 3D scene (remote player rendering) and the DOM HUD (chat,
 * leaderboard) need independent subscriptions to the same room events.
 */
export class NetworkClient {
  private client: Client;
  room: Room | null = null;
  players = new Map<string, RemotePlayer>();
  connected = false;

  private playerListeners = new Set<(players: Map<string, RemotePlayer>) => void>();
  private chatListeners = new Set<(msg: ChatEvent) => void>();
  private killFeedListeners = new Set<(msg: KillFeedEvent) => void>();
  private hitEffectListeners = new Set<(msg: HitEffectEvent) => void>();

  constructor() {
    this.client = new Client(GAME_SERVER_URL);
  }

  onPlayersChange(cb: (players: Map<string, RemotePlayer>) => void): () => void {
    this.playerListeners.add(cb);
    return () => this.playerListeners.delete(cb);
  }

  onChat(cb: (msg: ChatEvent) => void): () => void {
    this.chatListeners.add(cb);
    return () => this.chatListeners.delete(cb);
  }

  onKillFeed(cb: (msg: KillFeedEvent) => void): () => void {
    this.killFeedListeners.add(cb);
    return () => this.killFeedListeners.delete(cb);
  }

  onHitEffect(cb: (msg: HitEffectEvent) => void): () => void {
    this.hitEffectListeners.add(cb);
    return () => this.hitEffectListeners.delete(cb);
  }

  async connect(username: string, colors: AvatarColors): Promise<boolean> {
    try {
      const room = await this.client.joinOrCreate<any>("fight_sim", { username, colors });
      this.room = room;
      this.connected = true;

      const emitPlayers = () => this.playerListeners.forEach((cb) => cb(this.players));

      room.state.players.onAdd((player: any, sessionId: string) => {
        this.players.set(sessionId, toRemotePlayer(sessionId, player));
        player.onChange(() => {
          this.players.set(sessionId, toRemotePlayer(sessionId, player));
          emitPlayers();
        });
        emitPlayers();
      });

      room.state.players.onRemove((_player: any, sessionId: string) => {
        this.players.delete(sessionId);
        emitPlayers();
      });

      room.onMessage("chat", (msg: ChatEvent) => {
        this.chatListeners.forEach((cb) => cb(msg));
      });

      room.onMessage("killFeed", (msg: KillFeedEvent) => {
        this.killFeedListeners.forEach((cb) => cb(msg));
      });

      room.onMessage("hitEffect", (msg: HitEffectEvent) => {
        this.hitEffectListeners.forEach((cb) => cb(msg));
      });

      room.onLeave(() => {
        this.connected = false;
      });

      return true;
    } catch (err) {
      console.error("Failed to connect to game server", err);
      this.connected = false;
      return false;
    }
  }

  get sessionId(): string | null {
    return this.room?.sessionId ?? null;
  }

  sendMove(x: number, y: number, z: number, yaw: number, anim: string) {
    this.room?.send("move", { x, y, z, yaw, anim });
  }

  sendChat(text: string) {
    this.room?.send("chat", { text });
  }

  sendAttack(targetId: string) {
    this.room?.send("attack", { targetId });
  }

  sendAbility(weapon: WeaponId) {
    this.room?.send("ability", { weapon });
  }

  disconnect() {
    this.room?.leave();
    this.room = null;
    this.connected = false;
  }
}
