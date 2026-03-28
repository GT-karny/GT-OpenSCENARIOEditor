/**
 * Gizmo for moving a signal along road coordinates (s, t).
 *
 * - S-axis arrow (red): drags signal along road reference line
 * - T-axis arrow (green): drags signal laterally across the road
 *
 * Modeled after RoadGizmo.tsx but uses raw (s, t) instead of (laneId, s).
 * Placed inside the OpenDRIVE rotation group (Z-up coordinates).
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { worldToRoad, evaluateReferenceLineAtS, stToXyz } from '@osce/opendrive';

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
  plane: THREE.Plane;
  roadLength: number;
}

const ARROW_LEN = 6;
const SHAFT_R = 0.12;
const HEAD_R = 0.36;
const HEAD_LEN = 0.9;

function GizmoArrow({
  axis,
  color,
  onPointerDown,
}: {
  axis: 's' | 't';
  color: string;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  // cylinderGeometry grows along Y-axis by default.
  // Inside the rotation group, local coords are OpenDRIVE (X=forward, Y=left, Z=up).
  // S-axis: arrow points in +X → rotate Y-up cylinder to X via Z rotation
  // T-axis: arrow points in +Y → keep Y-up cylinder as-is
  const rotation: [number, number, number] =
    axis === 's' ? [0, 0, -Math.PI / 2] : [0, 0, 0];

  return (
    <group rotation={rotation}>
      <mesh position={[0, ARROW_LEN / 2, 0]} onPointerDown={onPointerDown}>
        <cylinderGeometry args={[SHAFT_R, SHAFT_R, ARROW_LEN, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} depthTest={false} />
      </mesh>
      <mesh position={[0, ARROW_LEN + HEAD_LEN / 2, 0]} onPointerDown={onPointerDown}>
        <coneGeometry args={[HEAD_R, HEAD_LEN, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} depthTest={false} />
      </mesh>
    </group>
  );
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
  const { camera, gl } = useThree();
  const dragRef = useRef<DragState | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const groupRef = useRef<THREE.Group>(null);

  // Live position during drag
  const [livePos, setLivePos] = useState<{ x: number; y: number; h: number } | null>(null);

  // Keep latest values in refs to avoid stale closures in DOM event handlers
  const propsRef = useRef({
    openDriveDocument,
    orbitControlsRef,
    onDragEnd,
    camera,
    roadId,
    signalId,
  });
  propsRef.current = {
    openDriveDocument,
    orbitControlsRef,
    onDragEnd,
    camera,
    roadId,
    signalId,
  };

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      const { openDriveDocument: odr } = propsRef.current;
      if (!drag || !odr) return;

      // Convert mouse to NDC
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );

      // Raycast to drag plane (Z-up in OpenDRIVE rotation group)
      raycaster.current.setFromCamera(mouse, propsRef.current.camera);

      // Transform ray into the rotation group's local space
      if (groupRef.current?.parent) {
        const invMatrix = new THREE.Matrix4().copy(groupRef.current.parent.matrixWorld).invert();
        raycaster.current.ray.applyMatrix4(invMatrix);
      }

      const intersection = new THREE.Vector3();
      if (!raycaster.current.ray.intersectPlane(drag.plane, intersection)) return;

      // intersection is now in OpenDRIVE coords (x, y, z)
      const odrX = intersection.x;
      const odrY = intersection.y;

      const result = worldToRoad(odr, odrX, odrY, 30);
      if (!result || result.roadId !== drag.roadId) return;

      // Clamp s to road bounds
      const clampedS = Math.max(0, Math.min(result.s, drag.roadLength));

      if (drag.axis === 's') {
        // S-axis: update s, keep t
        drag.s = clampedS;
      } else {
        // T-axis: update t, keep s
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
    },
    [gl],
  );

  const handlePointerUp = useCallback(() => {
    const drag = dragRef.current;
    const { orbitControlsRef: oRef, onDragEnd: onEnd, roadId: rId, signalId: sId } =
      propsRef.current;

    // Re-enable orbit controls
    if (oRef?.current) oRef.current.enabled = true;

    // Remove DOM listeners
    gl.domElement.removeEventListener('pointermove', handlePointerMove);
    gl.domElement.removeEventListener('pointerup', handlePointerUp);

    // Notify parent with final (s, t)
    if (drag) {
      onEnd?.(rId, sId, drag.s, drag.t);
    }

    dragRef.current = null;
    setLivePos(null);
  }, [gl, handlePointerMove]);

  const startDragImpl = useCallback(
    (axis: 's' | 't', event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();

      const { orbitControlsRef: oRef, openDriveDocument: odr, roadId: rId } = propsRef.current;

      const road = odr.roads.find((r) => r.id === rId);
      if (!road) return;

      // Drag plane at z=0 in OpenDRIVE coords (ground level)
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

      dragRef.current = {
        axis,
        roadId: rId,
        s: currentS,
        t: currentT,
        plane,
        roadLength: road.length,
      };

      // Disable orbit controls
      if (oRef?.current) oRef.current.enabled = false;

      // Add DOM listeners for drag tracking
      gl.domElement.addEventListener('pointermove', handlePointerMove);
      gl.domElement.addEventListener('pointerup', handlePointerUp);
    },
    [currentS, currentT, gl, handlePointerMove, handlePointerUp],
  );

  const handleSPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => startDragImpl('s', e),
    [startDragImpl],
  );

  const handleTPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => startDragImpl('t', e),
    [startDragImpl],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      gl.domElement.removeEventListener('pointerup', handlePointerUp);
      if (propsRef.current.orbitControlsRef?.current) {
        propsRef.current.orbitControlsRef.current.enabled = true;
      }
    };
  }, [gl, handlePointerMove, handlePointerUp]);

  // Use live position during drag, otherwise prop position
  const posX = livePos?.x ?? signalPosition.x;
  const posY = livePos?.y ?? signalPosition.y;
  const heading = livePos?.h ?? signalPosition.h;

  return (
    <group ref={groupRef} position={[posX, posY, 0]} rotation={[0, 0, heading]}>
      <GizmoArrow axis="s" color="#ff4444" onPointerDown={handleSPointerDown} />
      <GizmoArrow axis="t" color="#44ff44" onPointerDown={handleTPointerDown} />
    </group>
  );
};

SignalGizmo.displayName = 'SignalGizmo';
