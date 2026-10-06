"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type RAPIER from "@dimforge/rapier3d-compat";
import {
  WALK_SPEED,
  JUMP_POWER,
  GRAVITY,
  CHARACTER_CAPSULE,
  DAMAGE,
  SWORD_RANGE,
  SWORD_ARC_DEGREES,
  ATTACK_COOLDOWN_MS,
  ABILITY_COOLDOWN_MS,
  FLASH_DISTANCE,
  KNOCKBACK_SPEED,
  KNOCKBACK_DURATION_MS,
  SLOW_MULTIPLIER,
  SLOW_DURATION_MS,
  type AvatarColors,
  type WeaponId,
} from "@blockverse/shared";
import { usePhysics } from "./PhysicsProvider";
import type { InputController } from "./InputController";
import { CharacterRig, type RigHandle } from "./CharacterRig";
import { pickMotionState, computePose } from "./CharacterAnimator";
import { yawForward, yawRight, wrapAngle, type OrbitState } from "./orbitMath";
import { DUMMY_POSITION, type DummyHandle } from "./PracticeDummy";
import type { NetworkClient } from "./NetworkClient";

const TURN_SPEED = 14; // higher = snappier facing turns
const MAX_JUMPS = 2; // double jump: one from ground, one more in the air
const SLASH_DURATION = 0.28; // seconds, arm-swing animation length
const MOVE_SEND_INTERVAL = 1 / 15; // throttle network position updates to 15Hz

type Props = {
  input: InputController;
  orbit: RefObject<OrbitState>;
  colors: AvatarColors;
  targetRef: RefObject<THREE.Group | null>;
  dummyRef: RefObject<DummyHandle | null>;
  network?: NetworkClient | null;
  equippedWeapon?: WeaponId;
  abilityStatusRef?: RefObject<{ cooldownRemaining: number }>;
  onEquipChange?: (equipped: boolean) => void;
};

export function LocalPlayerController({
  input,
  orbit,
  colors,
  targetRef,
  dummyRef,
  network,
  equippedWeapon = "default",
  abilityStatusRef,
  onEquipChange,
}: Props) {
  const { RAPIER, world } = usePhysics();
  const rigRef = useRef<RigHandle | null>(null);
  const colliderRef = useRef<RAPIER.Collider | null>(null);
  const controllerRef = useRef<RAPIER.KinematicCharacterController | null>(null);
  const verticalVelocity = useRef(0);
  const grounded = useRef(false);
  const jumpsUsed = useRef(0);
  const jumpKeyLatched = useRef(false);
  const clock = useRef(0);
  const facingYaw = useRef(0);
  const [swordEquipped, setSwordEquipped] = useState(true);
  const swordEquippedRef = useRef(swordEquipped);
  swordEquippedRef.current = swordEquipped;
  const attackCooldown = useRef(0);
  const abilityCooldown = useRef(0);
  const slashTimer = useRef(0);
  const moveSendTimer = useRef(0);
  const equippedWeaponRef = useRef(equippedWeapon);
  equippedWeaponRef.current = equippedWeapon;
  const knockback = useRef({ x: 0, z: 0, timer: 0 });
  const slowTimer = useRef(0);

  useEffect(() => {
    if (!network) return;
    return network.onHitEffect((msg) => {
      if (msg.targetId !== network.sessionId) return;
      if (msg.type === "knockback") {
        knockback.current = { x: msg.dirX ?? 0, z: msg.dirZ ?? 0, timer: KNOCKBACK_DURATION_MS / 1000 };
      } else if (msg.type === "slow") {
        slowTimer.current = SLOW_DURATION_MS / 1000;
      }
    });
  }, [network]);

  const radius = CHARACTER_CAPSULE.radius;
  const halfHeight = CHARACTER_CAPSULE.halfHeight;
  const colliderOffset = radius + halfHeight; // feet-space y -> capsule-center y

  useEffect(() => {
    const desc = RAPIER.ColliderDesc.capsule(halfHeight, radius).setTranslation(0, colliderOffset, 0);
    const collider = world.createCollider(desc);
    const controller = world.createCharacterController(0.05);
    controller.setMaxSlopeClimbAngle((45 * Math.PI) / 180);
    controller.setMinSlopeSlideAngle((30 * Math.PI) / 180);
    controller.enableAutostep(0.5, 0.2, true);
    controller.enableSnapToGround(0.3);
    colliderRef.current = collider;
    controllerRef.current = controller;

    if (rigRef.current) {
      (targetRef as React.MutableRefObject<THREE.Group | null>).current = rigRef.current.root;
    }

    return () => {
      world.removeCollider(collider, false);
      world.removeCharacterController(controller);
      colliderRef.current = null;
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [RAPIER, world]);

  useFrame((_, delta) => {
    const collider = colliderRef.current;
    const controller = controllerRef.current;
    const rig = rigRef.current;
    if (!collider || !controller || !rig) return;

    const dt = Math.min(delta, 1 / 30);
    clock.current += dt;
    if (attackCooldown.current > 0) attackCooldown.current -= dt;
    if (abilityCooldown.current > 0) abilityCooldown.current -= dt;
    if (slashTimer.current > 0) slashTimer.current -= dt;

    if (input.consumeEquipToggle()) {
      setSwordEquipped((prev) => {
        const next = !prev;
        onEquipChange?.(next);
        return next;
      });
    }

    const move = input.getMoveVector();
    const forward = yawForward(orbit.current.yaw);
    const right = yawRight(orbit.current.yaw);
    const forwardAmount = -move.z;
    const rightAmount = move.x;

    const worldDir = new THREE.Vector3()
      .addScaledVector(forward, forwardAmount)
      .addScaledVector(right, rightAmount);
    const horizontalSpeedFrac = Math.min(worldDir.length(), 1);
    if (horizontalSpeedFrac > 0) worldDir.normalize();

    const jumpHeld = input.isJumpHeld();
    const jumpPressed = jumpHeld && !jumpKeyLatched.current;
    jumpKeyLatched.current = jumpHeld;

    if (jumpPressed && jumpsUsed.current < MAX_JUMPS) {
      verticalVelocity.current = JUMP_POWER;
      jumpsUsed.current += 1;
      grounded.current = false;
    } else {
      verticalVelocity.current += GRAVITY * dt;
    }

    if (slowTimer.current > 0) slowTimer.current -= dt;
    const effectiveWalkSpeed = slowTimer.current > 0 ? WALK_SPEED * SLOW_MULTIPLIER : WALK_SPEED;

    let knockbackX = 0;
    let knockbackZ = 0;
    if (knockback.current.timer > 0) {
      knockback.current.timer -= dt;
      knockbackX = knockback.current.x * KNOCKBACK_SPEED * dt;
      knockbackZ = knockback.current.z * KNOCKBACK_SPEED * dt;
    }

    const desiredMovement = {
      x: worldDir.x * effectiveWalkSpeed * horizontalSpeedFrac * dt + knockbackX,
      y: verticalVelocity.current * dt,
      z: worldDir.z * effectiveWalkSpeed * horizontalSpeedFrac * dt + knockbackZ,
    };

    controller.computeColliderMovement(collider, desiredMovement);
    const corrected = controller.computedMovement();
    grounded.current = controller.computedGrounded();
    if (grounded.current) {
      jumpsUsed.current = 0;
      if (verticalVelocity.current < 0) verticalVelocity.current = 0;
    }

    const pos = collider.translation();
    const next = { x: pos.x + corrected.x, y: pos.y + corrected.y, z: pos.z + corrected.z };

    // Safety net: the shape-cast character controller can occasionally miss
    // large static colliders (Rapier precision quirk), letting the capsule
    // drift into the floor. A downward raycast is far more reliable, so use
    // it to hard-clamp the character to the ground whenever it's close.
    if (verticalVelocity.current <= 0) {
      const rayOrigin = { x: next.x, y: next.y + 3, z: next.z };
      const ray = new RAPIER.Ray(rayOrigin, { x: 0, y: -1, z: 0 });
      const hit = world.castRay(ray, 20, true, undefined, undefined, collider);
      if (hit) {
        const groundY = rayOrigin.y - hit.timeOfImpact;
        const feetY = next.y - colliderOffset;
        if (feetY <= groundY + 0.05) {
          next.y = groundY + colliderOffset;
          grounded.current = true;
          jumpsUsed.current = 0;
          verticalVelocity.current = 0;
        }
      }
    }

    // Last-resort catch: if the character ever ends up well below the map
    // (shouldn't happen with the raycast clamp above, but a void-fall must
    // never be unrecoverable), respawn it back above the origin.
    if (next.y - colliderOffset < -50) {
      next.x = 0;
      next.y = colliderOffset;
      next.z = 0;
      verticalVelocity.current = 0;
      jumpsUsed.current = 0;
      grounded.current = false;
    }

    collider.setTranslation(next);
    rig.root.position.set(next.x, next.y - colliderOffset, next.z);

    if (horizontalSpeedFrac > 0.05 || orbit.current.shiftLock) {
      const targetYaw = orbit.current.shiftLock
        ? orbit.current.yaw + Math.PI
        : Math.atan2(worldDir.x, worldDir.z);
      facingYaw.current += wrapAngle(targetYaw - facingYaw.current) * Math.min(1, TURN_SPEED * dt);
    }
    rig.root.rotation.y = facingYaw.current;

    if (swordEquippedRef.current && input.consumeAttack() && attackCooldown.current <= 0) {
      attackCooldown.current = ATTACK_COOLDOWN_MS / 1000;
      slashTimer.current = SLASH_DURATION;

      // The click attack is always the plain 25-damage sword slash —
      // weapon identity only changes what the E ability does.
      const faceDir = new THREE.Vector3(Math.sin(facingYaw.current), 0, Math.cos(facingYaw.current));
      const inArc = (targetX: number, targetZ: number) => {
        const toTarget = new THREE.Vector3(targetX - next.x, 0, targetZ - next.z);
        const dist = toTarget.length();
        if (dist > SWORD_RANGE) return false;
        toTarget.normalize();
        const angle = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(faceDir.dot(toTarget), -1, 1)));
        return angle <= SWORD_ARC_DEGREES / 2;
      };

      // Real players take priority over the practice dummy.
      let hitRemote = false;
      if (network?.connected) {
        for (const [id, p] of network.players) {
          if (id === network.sessionId || p.health <= 0 || p.spawnProtected) continue;
          if (inArc(p.x, p.z)) {
            network.sendAttack(id);
            hitRemote = true;
            break;
          }
        }
      }

      if (!hitRemote) {
        const dummy = dummyRef.current;
        if (dummy && dummy.isAlive() && inArc(DUMMY_POSITION.x, DUMMY_POSITION.z)) {
          dummy.takeDamage(DAMAGE.slash);
        }
      }
    }

    if (input.consumeAbility() && abilityCooldown.current <= 0 && equippedWeaponRef.current !== "default") {
      abilityCooldown.current = ABILITY_COOLDOWN_MS / 1000;

      if (equippedWeaponRef.current === "flash") {
        const forwardDir = yawForward(facingYaw.current);
        next.x += forwardDir.x * FLASH_DISTANCE;
        next.z += forwardDir.z * FLASH_DISTANCE;
        collider.setTranslation(next);
        rig.root.position.set(next.x, next.y - colliderOffset, next.z);
      } else if (network?.connected) {
        network.sendAbility(equippedWeaponRef.current);
      }
    }

    // Single-frame grounded blips (the shape-cast controller occasionally
    // misses for one frame even while standing still) shouldn't flash the
    // jump/fall pose — only treat the character as airborne once vertical
    // speed has actually built up past a real jump/fall.
    const effectivelyGrounded = grounded.current || Math.abs(verticalVelocity.current) < 5;
    const speed = horizontalSpeedFrac * WALK_SPEED;
    const motionState = pickMotionState({ speed, grounded: effectivelyGrounded, verticalVelocity: verticalVelocity.current });

    if (abilityStatusRef) {
      abilityStatusRef.current = { cooldownRemaining: Math.max(0, abilityCooldown.current) };
    }

    moveSendTimer.current -= dt;
    if (network?.connected && moveSendTimer.current <= 0) {
      moveSendTimer.current = MOVE_SEND_INTERVAL;
      network.sendMove(next.x, next.y - colliderOffset, next.z, facingYaw.current, motionState);
    }

    const pose = computePose(motionState, clock.current, speed);
    rig.leftArm.rotation.x = pose.leftArm;
    if (slashTimer.current > 0) {
      // Diagonal downward chop: swing through a contained arc (not a full
      // rotation) with a bit of sideways cross so it reads as a slash.
      const t = 1 - slashTimer.current / SLASH_DURATION;
      const swing = Math.sin(t * Math.PI); // 0 -> 1 -> 0, eases in and out
      rig.rightArm.rotation.x = THREE.MathUtils.lerp(-0.6, -1.9, t);
      rig.rightArm.rotation.z = THREE.MathUtils.lerp(0.5, -0.4, t) * swing + 0.1;
    } else {
      rig.rightArm.rotation.x = pose.rightArm;
      rig.rightArm.rotation.z = 0;
    }
    rig.leftLeg.rotation.x = pose.leftLeg;
    rig.rightLeg.rotation.x = pose.rightLeg;
    rig.head.rotation.x = pose.headTilt;
  });

  return <CharacterRig ref={rigRef} colors={colors} swordEquipped={swordEquipped} />;
}
