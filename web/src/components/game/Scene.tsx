"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AvatarColors } from "@blockverse/shared";
import { PhysicsProvider, usePhysics } from "./PhysicsProvider";
import { InputController } from "./InputController";
import { createOrbitState } from "./orbitMath";
import { CameraRig } from "./CameraRig";
import { LocalPlayerController } from "./LocalPlayerController";
import { getAvatarColors } from "@/lib/session";

const BASEPLATE_SIZE = 120;

function GroundCollider() {
  const { RAPIER, world } = usePhysics();
  useEffect(() => {
    const desc = RAPIER.ColliderDesc.cuboid(BASEPLATE_SIZE / 2, 0.5, BASEPLATE_SIZE / 2).setTranslation(
      0,
      -0.5,
      0
    );
    const collider = world.createCollider(desc);
    return () => world.removeCollider(collider, false);
  }, [RAPIER, world]);
  return null;
}

/** Advances the Rapier world once per frame, ahead of any character controller reads. */
function PhysicsStepper() {
  const { world } = usePhysics();
  useFrame(() => {
    world.step();
  });
  return null;
}

function Baseplate() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[BASEPLATE_SIZE, BASEPLATE_SIZE]} />
        <meshStandardMaterial color="#1c2230" />
      </mesh>
      <gridHelper
        args={[BASEPLATE_SIZE, BASEPLATE_SIZE / 2, "#4a5570", "#2a3142"]}
        position={[0, 0.01, 0]}
      />
    </>
  );
}

function SceneContents({ colors }: { colors: AvatarColors }) {
  const { gl } = useThree();
  const [input, setInput] = useState<InputController | null>(null);
  const orbitRef = useRef(createOrbitState());
  const targetRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const controller = new InputController(gl.domElement);
    setInput(controller);
    return () => controller.dispose();
  }, [gl]);

  if (!input) return null;

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[20, 30, 10]} intensity={1.1} castShadow />
      <Baseplate />
      <GroundCollider />
      <PhysicsStepper />
      <LocalPlayerController input={input} orbit={orbitRef} colors={colors} targetRef={targetRef} />
      <CameraRig input={input} orbit={orbitRef} target={targetRef} />
    </>
  );
}

export function Scene() {
  const [colors, setColors] = useState<AvatarColors | null>(null);

  useEffect(() => {
    setColors(getAvatarColors());
  }, []);

  if (!colors) return null;

  return (
    <Canvas shadows camera={{ fov: 60, near: 0.1, far: 500 }}>
      <color attach="background" args={["#0b0e14"]} />
      <PhysicsProvider>
        <SceneContents colors={colors} />
      </PhysicsProvider>
    </Canvas>
  );
}
