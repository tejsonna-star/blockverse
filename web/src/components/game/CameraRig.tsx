"use client";

import { type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA } from "@blockverse/shared";
import type { InputController } from "./InputController";
import { EYE_Y } from "./CharacterRig";
import { yawForward, yawRight, type OrbitState } from "./orbitMath";

const MIN_PITCH = -0.2;
const MAX_PITCH = 1.3;

type Props = {
  input: InputController;
  orbit: RefObject<OrbitState>;
  target: RefObject<THREE.Group | null>;
};

export function CameraRig({ input, orbit, target }: Props) {
  const { camera } = useThree();

  useFrame(() => {
    const state = orbit.current;
    const targetGroup = target.current;
    if (!state || !targetGroup) return;

    const { dx, dy } = input.consumeMouseDelta();
    state.yaw -= dx * CAMERA.orbitSensitivity;
    state.pitch = THREE.MathUtils.clamp(state.pitch - dy * CAMERA.orbitSensitivity, MIN_PITCH, MAX_PITCH);

    const wheel = input.consumeWheelDelta();
    if (wheel !== 0) {
      state.zoom = THREE.MathUtils.clamp(
        state.zoom + wheel * 0.01 * CAMERA.zoomSensitivity,
        CAMERA.minZoom,
        CAMERA.maxZoom
      );
    }
    state.shiftLock = input.shiftLock;
    state.firstPerson = state.zoom <= CAMERA.minZoom + 0.5;

    const focus = new THREE.Vector3(
      targetGroup.position.x,
      targetGroup.position.y + EYE_Y,
      targetGroup.position.z
    );

    if (state.firstPerson) {
      const forward = yawForward(state.yaw);
      const look = new THREE.Vector3(
        forward.x * Math.cos(state.pitch),
        -Math.sin(state.pitch),
        forward.z * Math.cos(state.pitch)
      );
      camera.position.copy(focus);
      camera.lookAt(focus.clone().add(look));
    } else {
      const right = yawRight(state.yaw);
      const shoulderOffset = state.shiftLock
        ? right.clone().multiplyScalar(CAMERA.shiftLockShoulderOffset.x)
        : new THREE.Vector3();
      const adjustedFocus = focus.clone().add(shoulderOffset);

      const offset = new THREE.Vector3(
        Math.sin(state.yaw) * Math.cos(state.pitch),
        Math.sin(state.pitch),
        Math.cos(state.yaw) * Math.cos(state.pitch)
      ).multiplyScalar(state.zoom);

      camera.position.copy(adjustedFocus).add(offset);
      camera.lookAt(adjustedFocus);
    }
  });

  return null;
}
