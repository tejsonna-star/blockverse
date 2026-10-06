"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type RAPIER from "@dimforge/rapier3d-compat";
import { WALK_SPEED, JUMP_POWER, GRAVITY, CHARACTER_CAPSULE, type AvatarColors } from "@blockverse/shared";
import { usePhysics } from "./PhysicsProvider";
import type { InputController } from "./InputController";
import { CharacterRig, type RigHandle } from "./CharacterRig";
import { pickMotionState, computePose } from "./CharacterAnimator";
import { yawForward, yawRight, wrapAngle, type OrbitState } from "./orbitMath";

const TURN_SPEED = 14; // higher = snappier facing turns

type Props = {
  input: InputController;
  orbit: RefObject<OrbitState>;
  colors: AvatarColors;
  targetRef: RefObject<THREE.Group | null>;
};

export function LocalPlayerController({ input, orbit, colors, targetRef }: Props) {
  const { RAPIER, world } = usePhysics();
  const rigRef = useRef<RigHandle | null>(null);
  const colliderRef = useRef<RAPIER.Collider | null>(null);
  const controllerRef = useRef<RAPIER.KinematicCharacterController | null>(null);
  const verticalVelocity = useRef(0);
  const grounded = useRef(false);
  const clock = useRef(0);
  const facingYaw = useRef(0);

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

    if (grounded.current && input.isJumpHeld()) {
      verticalVelocity.current = JUMP_POWER;
      grounded.current = false;
    } else {
      verticalVelocity.current += GRAVITY * dt;
    }

    const desiredMovement = {
      x: worldDir.x * WALK_SPEED * horizontalSpeedFrac * dt,
      y: verticalVelocity.current * dt,
      z: worldDir.z * WALK_SPEED * horizontalSpeedFrac * dt,
    };

    controller.computeColliderMovement(collider, desiredMovement);
    const corrected = controller.computedMovement();
    grounded.current = controller.computedGrounded();
    if (grounded.current && verticalVelocity.current < 0) {
      verticalVelocity.current = 0;
    }

    const pos = collider.translation();
    const next = { x: pos.x + corrected.x, y: pos.y + corrected.y, z: pos.z + corrected.z };
    collider.setTranslation(next);
    rig.root.position.set(next.x, next.y - colliderOffset, next.z);

    if (horizontalSpeedFrac > 0.05 || orbit.current.shiftLock) {
      const targetYaw = orbit.current.shiftLock
        ? orbit.current.yaw + Math.PI
        : Math.atan2(worldDir.x, worldDir.z);
      facingYaw.current += wrapAngle(targetYaw - facingYaw.current) * Math.min(1, TURN_SPEED * dt);
    }
    rig.root.rotation.y = facingYaw.current;

    const speed = horizontalSpeedFrac * WALK_SPEED;
    const motionState = pickMotionState({ speed, grounded: grounded.current, verticalVelocity: verticalVelocity.current });
    const pose = computePose(motionState, clock.current, speed);
    rig.leftArm.rotation.x = pose.leftArm;
    rig.rightArm.rotation.x = pose.rightArm;
    rig.leftLeg.rotation.x = pose.leftLeg;
    rig.rightLeg.rotation.x = pose.rightLeg;
    rig.head.rotation.x = pose.headTilt;
  });

  return <CharacterRig ref={rigRef} colors={colors} />;
}
