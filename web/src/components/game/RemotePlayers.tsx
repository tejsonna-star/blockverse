"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { MAX_HEALTH } from "@blockverse/shared";
import { CharacterRig, CHARACTER_HEIGHT, type RigHandle } from "./CharacterRig";
import { pickMotionState, computePose } from "./CharacterAnimator";
import type { RemotePlayer } from "./NetworkClient";

function RemotePlayerView({ player }: { player: RemotePlayer }) {
  const wrapperRef = useRef<THREE.Group>(null!);
  const rigRef = useRef<RigHandle | null>(null);
  const target = useRef({ x: player.x, y: player.y, z: player.z, yaw: player.yaw });
  const clock = useRef(0);
  target.current = { x: player.x, y: player.y, z: player.z, yaw: player.yaw };

  useFrame((_, delta) => {
    const rig = rigRef.current;
    const wrapper = wrapperRef.current;
    if (!rig || !wrapper) return;
    const dt = Math.min(delta, 1 / 30);
    clock.current += dt;
    const t = Math.min(1, dt * 12);
    wrapper.position.lerp(new THREE.Vector3(target.current.x, target.current.y, target.current.z), t);
    const yawDiff =
      THREE.MathUtils.euclideanModulo(target.current.yaw - wrapper.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    wrapper.rotation.y += yawDiff * t;

    const motionState = pickMotionState({
      speed: player.anim === "walk" ? 10 : 0,
      grounded: player.anim !== "jump" && player.anim !== "fall",
      verticalVelocity: player.anim === "jump" ? 10 : player.anim === "fall" ? -10 : 0,
    });
    const pose = computePose(motionState, clock.current, 10);
    rig.leftArm.rotation.x = pose.leftArm;
    rig.rightArm.rotation.x = pose.rightArm;
    rig.leftLeg.rotation.x = pose.leftLeg;
    rig.rightLeg.rotation.x = pose.rightLeg;
    rig.head.rotation.x = pose.headTilt;
  });

  if (player.health <= 0) return null;

  return (
    <group ref={wrapperRef}>
      <CharacterRig ref={rigRef} colors={player.colors} swordEquipped />
      <Html position={[0, CHARACTER_HEIGHT + 0.6, 0]} center distanceFactor={14} occlude>
        <div className="flex flex-col items-center gap-0.5 select-none pointer-events-none">
          <span className="text-[10px] font-semibold text-white/90 drop-shadow">{player.username}</span>
          <div className="w-16 h-1.5 rounded-full bg-black/50 overflow-hidden border border-white/20">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-150"
              style={{ width: `${(player.health / MAX_HEALTH) * 100}%` }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}

export function RemotePlayers({
  players,
  selfId,
}: {
  players: Map<string, RemotePlayer>;
  selfId: string | null;
}) {
  const entries = Array.from(players.entries()).filter(([id]) => id !== selfId);
  return (
    <>
      {entries.map(([id, p]) => (
        <RemotePlayerView key={id} player={p} />
      ))}
    </>
  );
}
