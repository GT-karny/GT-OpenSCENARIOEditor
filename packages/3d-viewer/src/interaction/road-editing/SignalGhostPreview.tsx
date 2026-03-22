/**
 * Ghost preview for signal placement.
 * Renders a semi-transparent signal indicator at the snapped position.
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

/** Default signal height above ground (zOffset) */
const SIGNAL_HEIGHT = 4.0;

export function SignalGhostPreview({ ghost, openDriveDocument }: SignalGhostPreviewProps) {
  const position = useMemo(() => {
    if (!ghost) return null;

    const road = openDriveDocument.roads.find((r) => r.id === ghost.roadId);
    if (!road) return null;

    const pose = evaluateReferenceLineAtS(road.planView, ghost.s);
    const z = evaluateElevation(road.elevationProfile, ghost.s);
    const worldPos = stToXyz(pose, ghost.t, z);

    return {
      x: worldPos.x,
      y: worldPos.y,
      z: worldPos.z,
      heading: ghost.heading,
    };
  }, [ghost, openDriveDocument]);

  if (!ghost || !position) return null;

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[0, 0, position.heading]}
    >
      {/* Pole */}
      <mesh position={[0, 0, SIGNAL_HEIGHT / 2]}>
        <cylinderGeometry args={[0.05, 0.05, SIGNAL_HEIGHT, 8]} />
        <meshStandardMaterial
          color="#888888"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Signal head housing */}
      <mesh position={[0, 0, SIGNAL_HEIGHT]}>
        <boxGeometry args={[0.3, 0.3, 0.9]} />
        <meshStandardMaterial
          color="#FFD700"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ground marker ring */}
      <mesh position={[0, 0, 0.02]} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
