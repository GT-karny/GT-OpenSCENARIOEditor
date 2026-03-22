/**
 * Two-click road creation interaction.
 * Phase idle: click places the start point.
 * Phase startPlaced: mouse move shows preview, click places the end point and creates the road.
 * Drag on end click sets arc curvature direction.
 * Lives inside the OpenDRIVE rotation group (x/y/z = odr coords).
 */

import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { applySnap } from './snap-utils.js';
import { computeAutoArc } from './arc-math.js';

interface RoadCreationInteractionProps {
  /** Whether creation mode is active */
  active: boolean;
  /** Current creation phase */
  phase: 'idle' | 'startPlaced';
  /** Start position (valid when phase === 'startPlaced') */
  startX: number;
  startY: number;
  startHdg: number;
  /** Whether the start point has a heading constraint (snapped or chained) */
  hasStartConstraint: boolean;
  /** Full document for endpoint snapping */
  openDriveDocument: OpenDriveDocument;
  /** Callback when user clicks to place start point */
  onStartPlace: (
    x: number,
    y: number,
    hdg: number,
    snap?: { roadId: string; contactPoint: 'start' | 'end' },
  ) => void;
  /** Callback when user clicks to place end point and create the road */
  onRoadCreate: (
    startX: number,
    startY: number,
    startHdg: number,
    endX: number,
    endY: number,
    curvature: number,
    snapInfo?: { roadId: string; contactPoint: 'start' | 'end' },
  ) => void;
  /** Callback to update cursor position during creation */
  onCursorMove?: (x: number, y: number) => void;
  /** Whether grid snap is enabled */
  gridSnap?: boolean;
}

export function RoadCreationInteraction({
  active,
  phase,
  startX,
  startY,
  startHdg,
  hasStartConstraint,
  openDriveDocument,
  onStartPlace,
  onRoadCreate,
  onCursorMove,
  gridSnap = false,
}: RoadCreationInteractionProps) {
  const planeRef = useRef<THREE.Mesh>(null);
  const pointerDownRef = useRef<{ x: number; y: number; odrX: number; odrY: number } | null>(null);

  // Clear pending pointer state when phase resets to idle (e.g. Escape key)
  useEffect(() => {
    if (phase === 'idle') {
      pointerDownRef.current = null;
    }
  }, [phase]);

  const getOdrPoint = useCallback(
    (e: THREE.Event & { point: THREE.Vector3 }) => {
      // e.point is in world coordinates — convert to rotation group's local space (OpenDRIVE coords)
      let odrX = e.point.x;
      let odrY = e.point.y;
      if (planeRef.current?.parent) {
        const local = planeRef.current.parent.worldToLocal(e.point.clone());
        odrX = local.x;
        odrY = local.y;
      }

      const snapResult = applySnap(odrX, odrY, openDriveDocument, { gridSnap });
      odrX = snapResult.x;
      odrY = snapResult.y;

      const snapInfo =
        snapResult.snapped &&
        snapResult.snapType === 'endpoint' &&
        snapResult.snapRoadId &&
        snapResult.snapContactPoint
          ? {
              roadId: snapResult.snapRoadId,
              contactPoint: snapResult.snapContactPoint,
              heading: snapResult.snapHeading,
            }
          : undefined;

      return { odrX, odrY, snapInfo };
    },
    [openDriveDocument, gridSnap],
  );

  const handlePointerDown = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; point: THREE.Vector3; nativeEvent: PointerEvent }) => {
      if (!active) return;
      const ne = e.nativeEvent;
      if (ne.button !== 0) return; // Left click only
      e.stopPropagation();

      const { odrX, odrY } = getOdrPoint(e);
      pointerDownRef.current = { x: ne.clientX, y: ne.clientY, odrX, odrY };
    },
    [active, getOdrPoint],
  );

  const handlePointerUp = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; point: THREE.Vector3; nativeEvent: PointerEvent }) => {
      if (!active || !pointerDownRef.current) return;
      const ne = e.nativeEvent;
      if (ne.button !== 0) return;
      e.stopPropagation();

      const downPos = pointerDownRef.current;
      pointerDownRef.current = null;

      const { odrX, odrY, snapInfo } = getOdrPoint(e);

      if (phase === 'idle') {
        // Place start point
        let hdg = 0;
        if (snapInfo?.heading !== undefined) {
          // Align heading with the snapped endpoint
          hdg = snapInfo.heading;
        }
        const snap = snapInfo
          ? { roadId: snapInfo.roadId, contactPoint: snapInfo.contactPoint }
          : undefined;
        onStartPlace(downPos.odrX, downPos.odrY, hdg, snap);
      } else if (phase === 'startPlaced') {
        // Place end point and create road
        const chord = Math.hypot(odrX - startX, odrY - startY);
        if (chord < 0.5) return; // Too short, ignore

        // Auto-compute curvature from start heading constraint
        const arc = computeAutoArc(startX, startY, startHdg, odrX, odrY, hasStartConstraint);

        const snap = snapInfo
          ? { roadId: snapInfo.roadId, contactPoint: snapInfo.contactPoint }
          : undefined;
        onRoadCreate(startX, startY, startHdg, odrX, odrY, arc.curvature, snap);
      }
    },
    [active, phase, startX, startY, startHdg, hasStartConstraint, getOdrPoint, onStartPlace, onRoadCreate],
  );

  const handlePointerMove = useCallback(
    (e: THREE.Event & { point: THREE.Vector3 }) => {
      if (!active || phase !== 'startPlaced') return;
      const { odrX, odrY } = getOdrPoint(e);
      onCursorMove?.(odrX, odrY);
    },
    [active, phase, getOdrPoint, onCursorMove],
  );

  if (!active) return null;

  return (
    <mesh
      ref={planeRef}
      rotation={[0, 0, 0]}
      position={[0, 0, -0.01]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
