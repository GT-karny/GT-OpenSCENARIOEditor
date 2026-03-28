/**
 * Signal placement interaction handler.
 * Renders an invisible ground plane to capture pointer events.
 * On hover: snaps to nearest road and computes signal placement position.
 * On click: places a new signal at the snapped position.
 */

import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { worldToRoad, computeSignalSnapT, computeSignalHeading, computeArmPlacement } from '@osce/opendrive';

export interface SignalPlaceGhostData {
  roadId: string;
  s: number;
  t: number;
  heading: number;
  /** Pole base t-position (road outermost area) */
  poleT: number;
  /** Signal head t-position (over driving lane) */
  headT: number;
  /** Arm length from pole to head */
  armLength: number;
}

interface SignalPlaceInteractionProps {
  /** Whether signal placement mode is active */
  active: boolean;
  /** Current sub-mode */
  subMode: 'place' | 'move';
  /** Full OpenDRIVE document */
  openDriveDocument: OpenDriveDocument;
  /** t-snap mode */
  tSnapMode: 'lane-above' | 'road-edge';
  /** Callback when user clicks to place a signal */
  onSignalPlace?: (roadId: string, s: number, t: number, heading: number) => void;
  /** Callback to update ghost preview position */
  onGhostUpdate?: (ghost: SignalPlaceGhostData | null) => void;
}

export function SignalPlaceInteraction({
  active,
  subMode,
  openDriveDocument,
  tSnapMode,
  onSignalPlace,
  onGhostUpdate,
}: SignalPlaceInteractionProps) {
  const planeRef = useRef<THREE.Mesh>(null);

  const getOdrPoint = useCallback(
    (e: { point: THREE.Vector3 }) => {
      let odrX = e.point.x;
      let odrY = e.point.y;
      if (planeRef.current?.parent) {
        const local = planeRef.current.parent.worldToLocal(e.point.clone());
        odrX = local.x;
        odrY = local.y;
      }
      return { odrX, odrY };
    },
    [],
  );

  const computeSnappedPosition = useCallback(
    (odrX: number, odrY: number): SignalPlaceGhostData | null => {
      const result = worldToRoad(openDriveDocument, odrX, odrY, 30);
      if (!result) return null;

      const road = openDriveDocument.roads.find((r) => r.id === result.roadId);
      if (!road) return null;

      // Determine side based on raw t (negative = right side, positive = left)
      const side: 'right' | 'left' = result.t < 0 ? 'right' : 'left';
      const heading = computeSignalHeading(road, result.s, true);

      if (tSnapMode === 'lane-above') {
        // Arm-mounted: pole at road edge, head over the lane nearest to cursor
        const arm = computeArmPlacement(road, result.s, side, result.t);
        return {
          roadId: result.roadId,
          s: result.s,
          t: arm.poleT,
          heading,
          poleT: arm.poleT,
          headT: arm.headT,
          armLength: arm.armLength,
        };
      } else {
        // Road-edge: straight pole at road edge, no arm
        const snappedT = computeSignalSnapT(road, result.s, 'road-edge', side);
        return {
          roadId: result.roadId,
          s: result.s,
          t: snappedT,
          heading,
          poleT: snappedT,
          headT: snappedT,
          armLength: 0,
        };
      }
    },
    [openDriveDocument, tSnapMode],
  );

  const handlePointerMove = useCallback(
    (e: THREE.Event & { point: THREE.Vector3 }) => {
      if (!active || subMode !== 'place') return;
      const { odrX, odrY } = getOdrPoint(e);
      const ghost = computeSnappedPosition(odrX, odrY);
      onGhostUpdate?.(ghost);
    },
    [active, subMode, getOdrPoint, computeSnappedPosition, onGhostUpdate],
  );

  const handlePointerUp = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; point: THREE.Vector3; nativeEvent: PointerEvent }) => {
      if (!active || subMode !== 'place') return;
      const ne = e.nativeEvent;
      if (ne.button !== 0) return;
      e.stopPropagation();

      const { odrX, odrY } = getOdrPoint(e);
      const snap = computeSnappedPosition(odrX, odrY);
      if (snap) {
        onSignalPlace?.(snap.roadId, snap.s, snap.t, snap.heading);
      }
    },
    [active, subMode, getOdrPoint, computeSnappedPosition, onSignalPlace],
  );

  const handlePointerLeave = useCallback(() => {
    onGhostUpdate?.(null);
  }, [onGhostUpdate]);

  if (!active || subMode !== 'place') return null;

  return (
    <mesh
      ref={planeRef}
      rotation={[0, 0, 0]}
      position={[0, 0, -0.01]}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
