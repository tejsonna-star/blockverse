import { DAMAGE } from "./config";

export type AttackKind = "slash" | "lunge" | "touch";

export function damageFor(kind: AttackKind): number {
  return DAMAGE[kind];
}
