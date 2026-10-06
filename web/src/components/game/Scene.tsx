"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { AvatarColors, type WeaponId } from "@blockverse/shared";
import { PhysicsProvider, usePhysics } from "./PhysicsProvider";
import { InputController } from "./InputController";
import { createOrbitState } from "./orbitMath";
import { CameraRig } from "./CameraRig";
import { LocalPlayerController } from "./LocalPlayerController";
import { PracticeDummy, type DummyHandle } from "./PracticeDummy";
import { RemotePlayers } from "./RemotePlayers";
import type { NetworkClient } from "./NetworkClient";
import { getAvatarColors } from "@/lib/session";

const MAP_SIZE = 800;
const ARENA_RADIUS = 110; // open play area kept clear of scenery
const FOG_COLOR = "#bcd9f2";

function GroundCollider() {
  const { RAPIER, world } = usePhysics();
  useEffect(() => {
    const desc = RAPIER.ColliderDesc.cuboid(MAP_SIZE / 2, 0.5, MAP_SIZE / 2).setTranslation(0, -0.5, 0);
    const collider = world.createCollider(desc);
    return () => world.removeCollider(collider, false);
  }, [RAPIER, world]);
  return null;
}

const WALL_HEIGHT = 20;

/** Invisible walls ringing the map so players can't wander off the edge into the void. */
function BoundaryWalls() {
  const { RAPIER, world } = usePhysics();
  useEffect(() => {
    const half = MAP_SIZE / 2;
    const walls = [
      { hx: half, hz: 1, x: 0, z: -half }, // north
      { hx: half, hz: 1, x: 0, z: half }, // south
      { hx: 1, hz: half, x: -half, z: 0 }, // west
      { hx: 1, hz: half, x: half, z: 0 }, // east
    ];
    const colliders = walls.map((w) => {
      const desc = RAPIER.ColliderDesc.cuboid(w.hx, WALL_HEIGHT / 2, w.hz).setTranslation(
        w.x,
        WALL_HEIGHT / 2,
        w.z
      );
      return world.createCollider(desc);
    });
    return () => colliders.forEach((c) => world.removeCollider(c, false));
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

function useGrassTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#3f8f3f";
    ctx.fillRect(0, 0, 256, 256);
    // Cheap procedural blade/patch variation — no external assets.
    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const shade = Math.random();
      ctx.fillStyle =
        shade < 0.5 ? "rgba(70,150,70,0.35)" : shade < 0.85 ? "rgba(30,90,30,0.3)" : "rgba(140,200,110,0.25)";
      ctx.fillRect(x, y, 2, 6);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(MAP_SIZE / 8, MAP_SIZE / 8);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

function Ground() {
  const grassTexture = useGrassTexture();
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
        <meshStandardMaterial map={grassTexture ?? undefined} color={grassTexture ? "#ffffff" : "#3f8f3f"} />
      </mesh>
      {/* Faint arena grid over the central play area, classic baseplate feel without looking sterile. */}
      <gridHelper
        args={[ARENA_RADIUS * 2.4, 48, "#ffffff", "#ffffff"]}
        position={[0, 0.02, 0]}
        material-opacity={0.08}
        material-transparent
      />
    </>
  );
}

type PropInstance = { position: [number, number, number]; scale: number; rotationY: number };

function scatterProps(count: number, seed: number): PropInstance[] {
  // Deterministic pseudo-random scatter (mulberry32) so scenery doesn't reshuffle every render.
  let s = seed;
  const rand = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const instances: PropInstance[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = ARENA_RADIUS + 10 + rand() * (MAP_SIZE / 2 - ARENA_RADIUS - 30);
    instances.push({
      position: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
      scale: 0.8 + rand() * 1.4,
      rotationY: rand() * Math.PI * 2,
    });
  }
  return instances;
}

function Trees() {
  const trunkRef = useRef<THREE.InstancedMesh>(null!);
  const leavesRef = useRef<THREE.InstancedMesh>(null!);
  const instances = useMemo(() => scatterProps(140, 1337), []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    instances.forEach((inst, i) => {
      dummy.position.set(inst.position[0], 1.5 * inst.scale, inst.position[2]);
      dummy.rotation.y = inst.rotationY;
      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);

      dummy.position.set(inst.position[0], 3.6 * inst.scale, inst.position[2]);
      dummy.updateMatrix();
      leavesRef.current.setMatrixAt(i, dummy.matrix);
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    leavesRef.current.instanceMatrix.needsUpdate = true;
  }, [instances]);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, instances.length]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 3, 6]} />
        <meshStandardMaterial color="#6b4a30" />
      </instancedMesh>
      <instancedMesh ref={leavesRef} args={[undefined, undefined, instances.length]} castShadow>
        <coneGeometry args={[1.6, 3, 7]} />
        <meshStandardMaterial color="#2f7d3a" />
      </instancedMesh>
    </>
  );
}

function Rocks() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const instances = useMemo(() => scatterProps(60, 4242), []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    instances.forEach((inst, i) => {
      dummy.position.set(inst.position[0], 0.4 * inst.scale, inst.position[2]);
      dummy.rotation.set(inst.rotationY * 0.3, inst.rotationY, inst.rotationY * 0.6);
      dummy.scale.setScalar(inst.scale * 0.6);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [instances]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, instances.length]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial color="#8a8a8a" flatShading />
    </instancedMesh>
  );
}

function SceneContents({
  colors,
  network,
  equippedWeapon,
  inputRef,
  abilityStatusRef,
  onEquipChange,
  onDummyKilled,
}: {
  colors: AvatarColors;
  network: NetworkClient | null;
  equippedWeapon?: WeaponId;
  inputRef?: React.RefObject<InputController | null>;
  abilityStatusRef?: React.RefObject<{ cooldownRemaining: number }>;
  onEquipChange?: (equipped: boolean) => void;
  onDummyKilled?: () => void;
}) {
  const { gl, scene } = useThree();
  const [input, setInput] = useState<InputController | null>(null);
  const orbitRef = useRef(createOrbitState());
  const targetRef = useRef<THREE.Group | null>(null);
  const dummyRef = useRef<DummyHandle | null>(null);
  const [, setPlayersVersion] = useState(0);

  useEffect(() => {
    if (!network) return;
    return network.onPlayersChange(() => setPlayersVersion((v) => v + 1));
  }, [network]);

  useEffect(() => {
    const controller = new InputController(gl.domElement);
    setInput(controller);
    if (inputRef) inputRef.current = controller;
    return () => {
      controller.dispose();
      if (inputRef) inputRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  useEffect(() => {
    scene.fog = new THREE.Fog(FOG_COLOR, MAP_SIZE * 0.15, MAP_SIZE * 0.55);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  if (!input) return null;

  return (
    <>
      {/* Fallback behind the sky dome's blind spots when viewed off-center near the map edge. */}
      <color attach="background" args={[FOG_COLOR]} />
      <Sky sunPosition={[120, 80, 60]} turbidity={3} rayleigh={1.2} distance={MAP_SIZE * 0.4} />
      <hemisphereLight args={["#cfe8ff", "#3f8f3f", 0.8]} />
      <directionalLight
        position={[120, 160, 60]}
        intensity={1.6}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-140}
        shadow-camera-right={140}
        shadow-camera-top={140}
        shadow-camera-bottom={-140}
        shadow-camera-far={400}
      />
      <Ground />
      <Trees />
      <Rocks />
      <GroundCollider />
      <BoundaryWalls />
      <PhysicsStepper />
      <PracticeDummy ref={dummyRef} onKilled={onDummyKilled} />
      {network && <RemotePlayers players={network.players} selfId={network.sessionId} />}
      <LocalPlayerController
        input={input}
        orbit={orbitRef}
        colors={colors}
        targetRef={targetRef}
        dummyRef={dummyRef}
        network={network}
        equippedWeapon={equippedWeapon}
        abilityStatusRef={abilityStatusRef}
        onEquipChange={onEquipChange}
      />
      <CameraRig input={input} orbit={orbitRef} target={targetRef} />
    </>
  );
}

export function Scene({
  network,
  equippedWeapon,
  inputRef,
  abilityStatusRef,
  onEquipChange,
  onDummyKilled,
}: {
  network?: NetworkClient | null;
  equippedWeapon?: WeaponId;
  inputRef?: React.RefObject<InputController | null>;
  abilityStatusRef?: React.RefObject<{ cooldownRemaining: number }>;
  onEquipChange?: (equipped: boolean) => void;
  onDummyKilled?: () => void;
}) {
  const [colors, setColors] = useState<AvatarColors | null>(null);

  useEffect(() => {
    setColors(getAvatarColors());
  }, []);

  if (!colors) return null;

  return (
    <Canvas shadows camera={{ fov: 60, near: 0.1, far: MAP_SIZE }}>
      <PhysicsProvider>
        <SceneContents
          colors={colors}
          network={network ?? null}
          equippedWeapon={equippedWeapon}
          inputRef={inputRef}
          abilityStatusRef={abilityStatusRef}
          onEquipChange={onEquipChange}
          onDummyKilled={onDummyKilled}
        />
      </PhysicsProvider>
    </Canvas>
  );
}
