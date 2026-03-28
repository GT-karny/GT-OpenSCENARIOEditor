/**
 * Ghost preview for signal placement.
 * Renders a semi-transparent arm-mounted signal indicator:
 * - Pole at road edge (poleT)
 * - Arm extending over the road
 * - Signal head housing at driving lane (headT)
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { evaluateReferenceLineAtS, evaluateElevation, stToXyz } from '@osce/opendrive';
import type { SignalPlaceGhostData } from './SignalPlaceInteraction.js';

interface SignalGhostPreviewProps {
  /** Ghost position data (null = hidden) */
  ghost: SignalPlaceGhostData | null;
  /** Full OpenDRIVE document for coordinate conversion */
  openDriveDocument: OpenDriveDocument;
}

/** Pole height (JP standard for arm-mounted vehicle signal) */
const ARM_POLE_HEIGHT = 6.5;
/** Signal head height for arm-mounted signals (JP standard) */
const ARM_HEAD_HEIGHT = 5.0;
/** Signal head height for straight pole signals */
const STRAIGHT_HEAD_HEIGHT = 5.0;
/** Arm pipe radius */
const ARM_RADIUS = 0.04;
/** Pole pipe radius */
const POLE_RADIUS = 0.06;

const ghostMaterial = {
  color: '#888888',
  transparent: true,
  opacity: 0.4,
  side: THREE.DoubleSide,
};

const headMaterial = {
  color: '#FFD700',
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
};

const ringMaterial = {
  color: '#FFD700',
  transparent: true,
  opacity: 0.6,
  side: THREE.DoubleSide,
};

export function SignalGhostPreview({ ghost, openDriveDocument }: SignalGhostPreviewProps) {
  const positions = useMemo(() => {
    if (!ghost) return null;

    const road = openDriveDocument.roads.find((r) => r.id === ghost.roadId);
    if (!road) return null;

    const pose = evaluateReferenceLineAtS(road.planView, ghost.s);
    const z = evaluateElevation(road.elevationProfile, ghost.s);

    // Pole base position (road edge / sidewalk)
    const poleWorld = stToXyz(pose, ghost.poleT, z);
    // Head position (over driving lane)
    const headWorld = stToXyz(pose, ghost.headT, z);

    return {
      pole: { x: poleWorld.x, y: poleWorld.y, z: poleWorld.z },
      head: { x: headWorld.x, y: headWorld.y, z: headWorld.z },
      heading: ghost.heading,
      armLength: ghost.armLength,
    };
  }, [ghost, openDriveDocument]);

  if (!ghost || !positions) return null;

  const isArmMode = positions.armLength > 0.1;

  // Arm mode: tall pole with horizontal arm extending to head
  // Straight mode: single pole with head on top
  const poleHeight = isArmMode ? ARM_POLE_HEIGHT : STRAIGHT_HEAD_HEIGHT;
  const headZ = isArmMode ? ARM_HEAD_HEIGHT : STRAIGHT_HEAD_HEIGHT;

  // Arm direction vector (from pole top to head)
  const dx = positions.head.x - positions.pole.x;
  const dy = positions.head.y - positions.pole.y;
  const armMidX = positions.pole.x + dx / 2;
  const armMidY = positions.pole.y + dy / 2;
  const armAngle = Math.atan2(dy, dx);

  return (
    <group>
      {/* Pole — vertical cylinder */}
      <mesh
        position={[positions.pole.x, positions.pole.y, positions.pole.z + poleHeight / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS, poleHeight, 8]} />
        <meshStandardMaterial {...ghostMaterial} />
      </mesh>

      {/* Arm — horizontal cylinder from pole top to head position (arm mode only) */}
      {isArmMode && (
        <mesh
          position={[armMidX, armMidY, positions.pole.z + headZ]}
          rotation={[0, 0, armAngle + Math.PI / 2]}
        >
          <cylinderGeometry args={[ARM_RADIUS, ARM_RADIUS, positions.armLength, 8]} />
          <meshStandardMaterial {...ghostMaterial} />
        </mesh>
      )}

      {/* Signal head housing */}
      <mesh position={[
        isArmMode ? positions.head.x : positions.pole.x,
        isArmMode ? positions.head.y : positions.pole.y,
        (isArmMode ? positions.head.z : positions.pole.z) + headZ,
      ]}>
        <boxGeometry args={[0.3, 0.3, 0.9]} />
        <meshStandardMaterial {...headMaterial} />
      </mesh>

      {/* Ground marker ring — at pole base */}
      <mesh position={[positions.pole.x, positions.pole.y, positions.pole.z + 0.02]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial {...ringMaterial} />
      </mesh>
    </group>
  );
}
