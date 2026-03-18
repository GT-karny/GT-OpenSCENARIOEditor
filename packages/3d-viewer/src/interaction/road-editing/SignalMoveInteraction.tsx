/**
 * Signal drag-to-move interaction handler.
 * In 'move' sub-mode, clicking a signal selects it; dragging updates its s/t position.
 * Uses an invisible ground plane + raycasting against signal meshes.
 */

import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import type { OpenDriveDocument, OdrSignal } from '@osce/shared';
import { worldToRoad, computeSignalSnapT } from '@osce/opendrive';

interface SignalMoveInteractionProps {
  /** Whether signal move mode is active */
  active: boolean;
  /** Full OpenDRIVE document */
  openDriveDocument: OpenDriveDocument;
  /** t-snap mode */
  tSnapMode: 'lane-above' | 'road-edge';
  /** Callback when a signal has been dragged to a new position */
  onSignalMove?: (roadId: string, signalId: string, newS: number, newT: number) => void;
  /** Ref to orbit controls (to disable during drag) */
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
}

export function SignalMoveInteraction({
  active,
  openDriveDocument,
  tSnapMode,
  onSignalMove,
  orbitControlsRef,
}: SignalMoveInteractionProps) {
  const planeRef = useRef<THREE.Mesh>(null);
  const [dragging, setDragging] = useState<{
    roadId: string;
    signalId: string;
    startScreenX: number;
    startScreenY: number;
  } | null>(null);

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

  // Find which signal is nearest to the world point
  const findNearestSignal = useCallback(
    (odrX: number, odrY: number): { roadId: string; signal: OdrSignal } | null => {
      const roadResult = worldToRoad(openDriveDocument, odrX, odrY, 30);
      if (!roadResult) return null;

      const road = openDriveDocument.roads.find((r) => r.id === roadResult.roadId);
      if (!road || road.signals.length === 0) return null;

      // Find the closest signal on this road by s-distance
      let bestSignal: OdrSignal | null = null;
      let bestDist = Infinity;
      for (const sig of road.signals) {
        const dist = Math.abs(sig.s - roadResult.s) + Math.abs(sig.t - roadResult.t);
        if (dist < bestDist && dist < 5) {
          bestDist = dist;
          bestSignal = sig;
        }
      }

      if (!bestSignal) return null;
      return { roadId: road.id, signal: bestSignal };
    },
    [openDriveDocument],
  );

  const handlePointerDown = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; point: THREE.Vector3; nativeEvent: PointerEvent }) => {
      if (!active) return;
      const ne = e.nativeEvent;
      if (ne.button !== 0) return;

      const { odrX, odrY } = getOdrPoint(e);
      const found = findNearestSignal(odrX, odrY);
      if (found) {
        e.stopPropagation();
        setDragging({
          roadId: found.roadId,
          signalId: found.signal.id,
          startScreenX: ne.clientX,
          startScreenY: ne.clientY,
        });
        if (orbitControlsRef?.current) {
          orbitControlsRef.current.enabled = false;
        }
      }
    },
    [active, getOdrPoint, findNearestSignal, orbitControlsRef],
  );

  const handlePointerUp = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; point: THREE.Vector3; nativeEvent: PointerEvent }) => {
      if (!dragging) return;
      e.stopPropagation();

      const { odrX, odrY } = getOdrPoint(e);
      const result = worldToRoad(openDriveDocument, odrX, odrY, 30);

      if (result) {
        const road = openDriveDocument.roads.find((r) => r.id === result.roadId);
        if (road) {
          const side = result.t < 0 ? 'right' : 'left';
          const snappedT = computeSignalSnapT(road, result.s, tSnapMode, side);
          onSignalMove?.(dragging.roadId, dragging.signalId, result.s, snappedT);
        }
      }

      if (orbitControlsRef?.current) {
        orbitControlsRef.current.enabled = true;
      }
      setDragging(null);
    },
    [dragging, getOdrPoint, openDriveDocument, tSnapMode, onSignalMove, orbitControlsRef],
  );

  if (!active) return null;

  return (
    <mesh
      ref={planeRef}
      rotation={[0, 0, 0]}
      position={[0, 0, -0.01]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
