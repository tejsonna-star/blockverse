import type { LimbPose } from "./CharacterRig";

export type MotionState = "idle" | "walk" | "jump" | "fall";

export type MotionInput = {
  speed: number; // horizontal speed, studs/sec
  grounded: boolean;
  verticalVelocity: number;
};

export function pickMotionState({ speed, grounded, verticalVelocity }: MotionInput): MotionState {
  if (!grounded) return verticalVelocity > 0.5 ? "jump" : "fall";
  return speed > 0.5 ? "walk" : "idle";
}

const WALK_SWING_AMPLITUDE = 0.9; // radians
const WALK_CYCLE_SPEED = 8; // phase units per stud/sec of movement
const IDLE_SWAY_AMPLITUDE = 0.05;
const IDLE_SWAY_SPEED = 1.2;

/**
 * Pure function: given motion state + a running clock + horizontal speed,
 * produce the limb pose for this frame. Keeping it pure (no internal state)
 * means it's trivially reusable for remote players driven by server snapshots.
 */
export function computePose(state: MotionState, clock: number, speed: number): LimbPose {
  switch (state) {
    case "walk": {
      const phase = clock * WALK_CYCLE_SPEED * Math.max(speed / 16, 0.4);
      const swing = Math.sin(phase) * WALK_SWING_AMPLITUDE;
      return { leftArm: -swing, rightArm: swing, leftLeg: swing, rightLeg: -swing, headTilt: 0 };
    }
    case "jump":
      return { leftArm: -2.4, rightArm: -2.4, leftLeg: 0.3, rightLeg: -0.3, headTilt: 0 };
    case "fall":
      return { leftArm: -2.8, rightArm: -2.8, leftLeg: -0.2, rightLeg: 0.2, headTilt: 0.1 };
    case "idle":
    default: {
      const sway = Math.sin(clock * IDLE_SWAY_SPEED) * IDLE_SWAY_AMPLITUDE;
      return { leftArm: sway, rightArm: -sway, leftLeg: 0, rightLeg: 0, headTilt: sway * 0.5 };
    }
  }
}
