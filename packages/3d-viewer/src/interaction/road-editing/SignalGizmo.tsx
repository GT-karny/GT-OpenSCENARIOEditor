/**
 * Gizmo for moving a signal along road coordinates (s, t).
 *
 * - S-axis arrow (red): drags signal along road reference line
 * - T-axis arrow (green): drags signal laterally across the road
 *
 * Uses raw (s, t) instead of (laneId, s).
 * Placed inside the OpenDRIVE rotation group (Z-up coordinates).
 */

import React, { useRef, useCallback, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { worldToRoad, evaluateReferenceLineAtS, stToXyz } from '@osce/opendrive';
import { GizmoArrow } from '../primitives/GizmoArrow.js';
import { useDragOnPlane } from '../primitives/useDragOnPlane.js';

interface SignalGizmoProps {
  /** Signal's resolved world position in OpenDRIVE coords */
  signalPosition: { x: number; y: number; z: number; h: number };
  /** Road that owns the signal */
  roadId: string;
  /** Signal ID */
  signalId: string;
  /** Current s coordinate */
  currentS: number;
  /** Current t coordinate */
  currentT: number;
  /** Full OpenDRIVE document */
  openDriveDocument: OpenDriveDocument;
  /** Ref to OrbitControls (disabled during drag) */
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
  /** Called when drag ends with new s, t */
  onDragEnd?: (roadId: string, signalId: string, newS: number, newT: number) => void;
}

interface DragState {
  axis: 's' | 't';
  roadId: string;
  s: number;
  t: number;
  roadLength: number;
}

export const SignalGizmo: React.FC<SignalGizmoProps> = ({
  signalPosition,
  roadId,
  signalId,
  currentS,
  currentT,
  openDriveDocument,
  orbitControlsRef,
  onDragEnd,
}) => {
  const dragRef = useRef<DragState | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Live position during drag
  const [livePos, setLivePos] = useState<{ x: number; y: number; h: number } | null>(null);

  const propsRef = useRef({ openDriveDocument, onDragEnd, roadId, signalId });
  propsRef.current = { openDriveDocument, onDragEnd, roadId, signalId };

  const activeAxisRef = useRef<'s' | 't'>('s');

  const createPlane = useCallback(
    (_e: ThreeEvent<PointerEvent>) => {
      const { openDriveDocument: odr, roadId: rId } = propsRef.current;
      const road = odr.roads.find((r) => r.id === rId);
      if (!road) return null;

      // Drag plane at z=0 in OpenDRIVE coords (ground level)
      dragRef.current = {
        axis: activeAxisRef.current,
        roadId: rId,
        s: currentS,
        t: currentT,
        roadLength: road.length,
      };

      return new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    },
    [currentS, currentT],
  );

  const getLocalSpaceMatrix = useCallback(() => {
    if (!groupRef.current?.parent) return null;
    return new THREE.Matrix4().copy(groupRef.current.parent.matrixWorld).invert();
  }, []);

  const onDragMove = useCallback((intersection: THREE.Vector3) => {
    const drag = dragRef.current;
    const { openDriveDocument: odr } = propsRef.current;
    if (!drag || !odr) return;

    const odrX = intersection.x;
    const odrY = intersection.y;

    const result = worldToRoad(odr, odrX, odrY, 30);
    if (!result || result.roadId !== drag.roadId) return;

    const clampedS = Math.max(0, Math.min(result.s, drag.roadLength));

    if (drag.axis === 's') {
      drag.s = clampedS;
    } else {
      drag.t = result.t;
    }

    // Compute new world position for visual feedback
    const road = odr.roads.find((r) => r.id === drag.roadId);
    if (road) {
      const pose = evaluateReferenceLineAtS(road.planView, drag.s);
      if (pose) {
        const worldPos = stToXyz(pose, drag.t, 0);
        setLivePos({ x: worldPos.x, y: worldPos.y, h: pose.hdg });
      }
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    const drag = dragRef.current;
    const { onDragEnd: onEnd, roadId: rId, signalId: sId } = propsRef.current;
    if (drag) {
      onEnd?.(rId, sId, drag.s, drag.t);
    }
    dragRef.current = null;
    setLivePos(null);
  }, []);

  const { startDrag } = useDragOnPlane({
    orbitControlsRef,
    createPlane,
    getLocalSpaceMatrix,
    onDragMove,
    onDragEnd: handleDragEnd,
  });

  const handleSPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      activeAxisRef.current = 's';
      startDrag(e);
    },
    [startDrag],
  );

  const handleTPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      activeAxisRef.current = 't';
      startDrag(e);
    },
    [startDrag],
  );

  // Use live position during drag, otherwise prop position
  const posX = livePos?.x ?? signalPosition.x;
  const posY = livePos?.y ?? signalPosition.y;
  const heading = livePos?.h ?? signalPosition.h;

  return (
    <group ref={groupRef} position={[posX, posY, 0]} rotation={[0, 0, heading]}>
      <GizmoArrow direction="x" color="#ff4444" onPointerDown={handleSPointerDown} />
      <GizmoArrow direction="y" color="#44ff44" onPointerDown={handleTPointerDown} />
    </group>
  );
};

SignalGizmo.displayName = 'SignalGizmo';
