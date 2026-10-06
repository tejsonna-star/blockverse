import { Room, Client } from "colyseus";
import {
  MAX_PLAYERS_PER_SERVER,
  DAMAGE,
  SWORD_RANGE,
  ATTACK_COOLDOWN_MS,
  ABILITY_COOLDOWN_MS,
  ABILITY_RANGE,
  RESPAWN_DELAY_MS,
  SPAWN_PROTECTION_MS,
  MAX_HEALTH,
  type WeaponId,
} from "@blockverse/shared";
import { FightSimState, PlayerState } from "../state/FightSimState";

type JoinOptions = {
  username?: string;
  colors?: { head?: string; torso?: string; arms?: string; legs?: string };
};

type MoveMessage = { x: number; y: number; z: number; yaw: number; anim: string };
type AttackMessage = { targetId: string; weapon?: WeaponId };
type AbilityMessage = { weapon: WeaponId };
type ChatMessage = { text: string };

function randomSpawn(): { x: number; z: number } {
  const angle = Math.random() * Math.PI * 2;
  const dist = 10 + Math.random() * 40;
  return { x: Math.cos(angle) * dist, z: Math.sin(angle) * dist };
}

export class FightSimRoom extends Room<FightSimState> {
  maxClients = MAX_PLAYERS_PER_SERVER;
  private lastAttackAt = new Map<string, number>();
  private lastAbilityAt = new Map<string, number>();

  onCreate() {
    this.setState(new FightSimState());

    this.onMessage<MoveMessage>("move", (client, msg) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || typeof msg?.x !== "number") return;
      p.x = msg.x;
      p.y = msg.y;
      p.z = msg.z;
      p.yaw = msg.yaw;
      p.anim = String(msg.anim ?? "idle").slice(0, 16);
    });

    this.onMessage<ChatMessage>("chat", (client, msg) => {
      const p = this.state.players.get(client.sessionId);
      const text = String(msg?.text ?? "").slice(0, 120).trim();
      if (!p || !text) return;
      this.broadcast("chat", { username: p.username, text });
    });

    this.onMessage<AttackMessage>("attack", (client, msg) => {
      const attacker = this.state.players.get(client.sessionId);
      const target = msg?.targetId ? this.state.players.get(msg.targetId) : undefined;
      if (!attacker || !target || target.health <= 0 || target.spawnProtected) return;

      const now = Date.now();
      const last = this.lastAttackAt.get(client.sessionId) ?? 0;
      if (now - last < ATTACK_COOLDOWN_MS) return;
      this.lastAttackAt.set(client.sessionId, now);

      const dist = Math.hypot(attacker.x - target.x, attacker.z - target.z);
      if (dist > SWORD_RANGE * 1.5) return; // generous server-side slack over the client check

      target.health = Math.max(0, target.health - DAMAGE.slash);

      if (target.health === 0) {
        attacker.kills += 1;
        attacker.streak += 1;
        target.deaths += 1;
        target.streak = 0;
        this.broadcast("killFeed", { killer: attacker.username, victim: target.username });

        this.clock.setTimeout(() => {
          const respawn = randomSpawn();
          target.health = MAX_HEALTH;
          target.x = respawn.x;
          target.z = respawn.z;
          target.spawnProtected = true;
          this.clock.setTimeout(() => {
            target.spawnProtected = false;
          }, SPAWN_PROTECTION_MS);
        }, RESPAWN_DELAY_MS);
      }
    });

    this.onMessage<AbilityMessage>("ability", (client, msg) => {
      const attacker = this.state.players.get(client.sessionId);
      if (!attacker) return;

      const now = Date.now();
      const last = this.lastAbilityAt.get(client.sessionId) ?? 0;
      if (now - last < ABILITY_COOLDOWN_MS) return;
      this.lastAbilityAt.set(client.sessionId, now);

      if (msg.weapon === "fartblast") {
        // AOE: push every other player within range away from the attacker.
        this.state.players.forEach((target, id) => {
          if (id === client.sessionId || target.health <= 0) return;
          const dx = target.x - attacker.x;
          const dz = target.z - attacker.z;
          const dist = Math.hypot(dx, dz);
          if (dist > ABILITY_RANGE || dist === 0) return;
          this.broadcast("hitEffect", { targetId: id, type: "knockback", dirX: dx / dist, dirZ: dz / dist });
        });
      } else if (msg.weapon === "snow") {
        // Slow the nearest other player within range.
        let nearestId: string | null = null;
        let nearestDist = ABILITY_RANGE;
        this.state.players.forEach((target, id) => {
          if (id === client.sessionId || target.health <= 0) return;
          const dist = Math.hypot(target.x - attacker.x, target.z - attacker.z);
          if (dist <= nearestDist) {
            nearestDist = dist;
            nearestId = id;
          }
        });
        if (nearestId) {
          this.broadcast("hitEffect", { targetId: nearestId, type: "slow" });
        }
      }
      // "flash" is a pure self-mobility move, handled entirely client-side.
    });
  }

  onJoin(client: Client, options: JoinOptions) {
    const p = new PlayerState();
    p.id = client.sessionId;
    p.username = (options?.username ?? "Guest").slice(0, 16);
    p.headColor = options?.colors?.head ?? "#f2c48d";
    p.torsoColor = options?.colors?.torso ?? "#2a6fdb";
    p.armsColor = options?.colors?.arms ?? "#f2c48d";
    p.legsColor = options?.colors?.legs ?? "#1f1f1f";
    const spawn = randomSpawn();
    p.x = spawn.x;
    p.z = spawn.z;
    p.spawnProtected = true;
    this.state.players.set(client.sessionId, p);

    this.clock.setTimeout(() => {
      p.spawnProtected = false;
    }, SPAWN_PROTECTION_MS);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.lastAttackAt.delete(client.sessionId);
  }
}
