/**
 * Invisible ground plane that captures clicks to create new roads.
 * When active, clicking on the ground creates a new road starting at that position.
 * Lives inside the OpenDRIVE rotation group (x/y/z = odr coords).
 */

import { useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { applySnap } from './snap-utils.js';

interface RoadCreationToolProps {
  /** Whether creation mode is active */
  active: boolean;
  /** Full document for endpoint snapping */
  openDriveDocument: OpenDriveDocument;
  /** Callback when user clicks to create a road at (x, y) with heading and optional snap info */
  onCreateRoad: (
    x: number,
    y: number,
    hdg: number,
    snapInfo?: { roadId: string; contactPoint: 'start' | 'end' },
  ) => void;
  /** Whether grid snap is enabled */
  gridSnap?: boolean;
}

export function RoadCreationTool({
  active,
  openDriveDocument,
  onCreateRoad,
  gridSnap = false,
}: RoadCreationToolProps) {
  const { camera } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);

  const handleClick = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; point: THREE.Vector3 }) => {
      if (!active) return;
      e.stopPropagation();

      // e.point is in local coordinates of the mesh (inside the rotation group)
      // So x = odr.x, y = odr.y
      let odrX = e.point.x;
      let odrY = e.point.y;

      // Apply snapping
      const snapResult = applySnap(odrX, odrY, openDriveDocument, { gridSnap });
      odrX = snapResult.x;
      odrY = snapResult.y;

      // Default heading: 0 (east-pointing road)
      // Could be smarter (e.g., toward camera direction), but simple is better for now
      const hdg = 0;

      // Pass snap info so the caller can set road links
      const snapInfo =
        snapResult.snapped && snapResult.snapType === 'endpoint' && snapResult.snapRoadId && snapResult.snapContactPoint
          ? { roadId: snapResult.snapRoadId, contactPoint: snapResult.snapContactPoint }
          : undefined;

      onCreateRoad(odrX, odrY, hdg, snapInfo);
    },
    [active, openDriveDocument, onCreateRoad, gridSnap, camera],
  );

  if (!active) return null;

  return (
    <mesh
      ref={planeRef}
      rotation={[0, 0, 0]}
      position={[0, 0, -0.01]}
      onClick={handleClick}
    >
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
