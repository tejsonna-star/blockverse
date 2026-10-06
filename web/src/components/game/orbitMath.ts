import * as THREE from "three";
import { CAMERA } from "@blockverse/shared";

export type OrbitState = {
  yaw: number;
  pitch: number;
  zoom: number;
  shiftLock: boolean;
  firstPerson: boolean;
};

export function createOrbitState(): OrbitState {
  return { yaw: 0, pitch: 0.35, zoom: CAMERA.defaultZoom, shiftLock: false, firstPerson: false };
}

/** World-space horizontal forward direction the camera looks, for a given yaw. */
export function yawForward(yaw: number): THREE.Vector3 {
  return new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
}

/** World-space horizontal right direction for a given yaw. */
export function yawRight(yaw: number): THREE.Vector3 {
  return new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
}

/** Normalize an angle difference to [-PI, PI]. */
export function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
