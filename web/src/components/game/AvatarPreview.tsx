"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { AvatarColors } from "@blockverse/shared";
import { CharacterRig, HIP_Y } from "./CharacterRig";

export function AvatarPreview({ colors }: { colors: AvatarColors }) {
  return (
    <Canvas camera={{ position: [4, 3.5, 6], fov: 45 }}>
      <color attach="background" args={["#0f131d"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <group position={[0, -HIP_Y * 0.6, 0]}>
        <CharacterRig colors={colors} />
      </group>
      <OrbitControls enablePan={false} target={[0, 2.5, 0]} minDistance={3} maxDistance={12} />
    </Canvas>
  );
}
