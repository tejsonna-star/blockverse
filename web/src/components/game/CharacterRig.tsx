"use client";

import { useMemo, forwardRef, useRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { AvatarColors, RIG } from "@blockverse/shared";

export type LimbPose = {
  leftArm: number; // radians, swing around X
  rightArm: number;
  leftLeg: number;
  rightLeg: number;
  headTilt: number;
};

export const IDLE_POSE: LimbPose = { leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0, headTilt: 0 };

// Joint heights derived from shared RIG proportions (feet at y = 0).
export const HIP_Y = RIG.limb.y; // top of legs
export const SHOULDER_Y = HIP_Y + RIG.torso.y; // top of torso
export const NECK_Y = SHOULDER_Y;
export const CHARACTER_HEIGHT = NECK_Y + RIG.headSize;
export const EYE_Y = NECK_Y + RIG.headSize * 0.75; // used for first-person camera placement

export type RigHandle = {
  root: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Group;
};

function useFaceTexture(headColor: string) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = headColor;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(40, 52, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(88, 52, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(64, 66, 24, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [headColor]);
}

type Props = {
  colors: AvatarColors;
  swordEquipped?: boolean;
};

function Sword() {
  return (
    <group position={[0, -RIG.limb.y + 0.1, 0.15]} rotation={[-0.25, 0, 0]}>
      <mesh position={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.2, 0.6, 0.15]} />
        <meshStandardMaterial color="#4a3826" />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.55, 0.15, 0.1]} />
        <meshStandardMaterial color="#8a8a8a" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.18, 1.7, 0.08]} />
        <meshStandardMaterial color="#d8dde3" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
}

/**
 * Original 6-box R6-style rig. Root origin is at the character's feet;
 * limb groups pivot at their joint (hip/shoulder) so rotating the group
 * swings the attached mesh like a pendulum. Rotations are driven
 * imperatively by a controller via the exposed ref handle (every-frame
 * pose updates would be too expensive as React state).
 */
export const CharacterRig = forwardRef<RigHandle, Props>(function CharacterRig({ colors, swordEquipped }, ref) {
  const rootRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);

  const faceTexture = useFaceTexture(colors.head);

  const headMaterials = useMemo(() => {
    const plain = new THREE.MeshStandardMaterial({ color: colors.head });
    const face = faceTexture
      ? new THREE.MeshStandardMaterial({ map: faceTexture })
      : new THREE.MeshStandardMaterial({ color: colors.head });
    // Box face order: +x, -x, +y, -y, +z, -z. Front face = +z.
    return [plain, plain, plain, plain, face, plain];
  }, [colors.head, faceTexture]);

  useImperativeHandle(
    ref,
    () => ({
      root: rootRef.current,
      leftLeg: leftLegRef.current,
      rightLeg: rightLegRef.current,
      leftArm: leftArmRef.current,
      rightArm: rightArmRef.current,
      head: headRef.current,
    }),
    []
  );

  return (
    <group ref={rootRef}>
      <group ref={leftLegRef} position={[-0.5, HIP_Y, 0]}>
        <mesh position={[0, -RIG.limb.y / 2, 0]} castShadow>
          <boxGeometry args={[RIG.limb.x, RIG.limb.y, RIG.limb.z]} />
          <meshStandardMaterial color={colors.legs} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.5, HIP_Y, 0]}>
        <mesh position={[0, -RIG.limb.y / 2, 0]} castShadow>
          <boxGeometry args={[RIG.limb.x, RIG.limb.y, RIG.limb.z]} />
          <meshStandardMaterial color={colors.legs} />
        </mesh>
      </group>

      <mesh position={[0, HIP_Y + RIG.torso.y / 2, 0]} castShadow>
        <boxGeometry args={[RIG.torso.x, RIG.torso.y, RIG.torso.z]} />
        <meshStandardMaterial color={colors.torso} />
      </mesh>

      <group ref={leftArmRef} position={[-1.5, SHOULDER_Y, 0]}>
        <mesh position={[0, -RIG.limb.y / 2, 0]} castShadow>
          <boxGeometry args={[RIG.limb.x, RIG.limb.y, RIG.limb.z]} />
          <meshStandardMaterial color={colors.arms} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[1.5, SHOULDER_Y, 0]}>
        <mesh position={[0, -RIG.limb.y / 2, 0]} castShadow>
          <boxGeometry args={[RIG.limb.x, RIG.limb.y, RIG.limb.z]} />
          <meshStandardMaterial color={colors.arms} />
        </mesh>
        {swordEquipped && <Sword />}
      </group>

      <group ref={headRef} position={[0, NECK_Y, 0]}>
        <mesh position={[0, RIG.headSize / 2, 0]} castShadow material={headMaterials}>
          <boxGeometry args={[RIG.headSize, RIG.headSize, RIG.headSize]} />
        </mesh>
      </group>
    </group>
  );
});
