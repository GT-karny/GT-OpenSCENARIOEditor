/**
 * Tangent direction handle extending from a control point.
 * Shows the heading direction as a line + draggable sphere.
 * Dragging the endpoint sphere rotates the heading of the geometry segment.
 */

import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OdrGeometry } from '@osce/shared';
import { useDragWithDeadZone } from '../primitives/useDragWithDeadZone.js';

interface TangentHandleProps {
  geometry: OdrGeometry;
  index: number;
  selected: boolean;
  handleLength?: number;
  onHeadingChange?: (index: number, newHdg: number) => void;
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
}

export function TangentHandle({
  geometry,
  index,
  selected,
  handleLength = 3,
  onHeadingChange,
  orbitControlsRef,
}: TangentHandleProps) {
  const { gl } = useThree();
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const { endPos, linePoints } = useMemo(() => {
    const sx = geometry.x;
    const sy = geometry.y;
    const hdg = geometry.hdg;
    const ex = sx + Math.cos(hdg) * handleLength;
    const ey = sy + Math.sin(hdg) * handleLength;
    const start = new THREE.Vector3(sx, sy, 0);
    const end = new THREE.Vector3(ex, ey, 0);
    return { endPos: end, linePoints: [start, end] };
  }, [geometry.x, geometry.y, geometry.hdg, handleLength]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(linePoints);
  }, [linePoints]);

  const propsRef = useRef({ geometry, index, handleLength, onHeadingChange });
  propsRef.current = { geometry, index, handleLength, onHeadingChange };

  const createPlane = useCallback(() => {
    const worldPos = new THREE.Vector3(endPos.x, endPos.y, endPos.z);
    sphereRef.current?.localToWorld(worldPos);
    return new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldPos.y);
  }, [endPos]);

  const worldToLocal = useCallback((intersection: THREE.Vector3) => {
    if (sphereRef.current?.parent) {
      sphereRef.current.parent.worldToLocal(intersection);
    }
  }, []);

  const onDragMove = useCallback((intersection: THREE.Vector3) => {
    const { geometry: geo, handleLength: hLen } = propsRef.current;
    const originX = geo.x;
    const originY = geo.y;
    const newHdg = Math.atan2(intersection.y - originY, intersection.x - originX);
    const previewX = originX + Math.cos(newHdg) * hLen;
    const previewY = originY + Math.sin(newHdg) * hLen;
    if (sphereRef.current) {
      sphereRef.current.position.set(previewX, previewY, 0);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    const { geometry: geo, index: idx, onHeadingChange: onChange } = propsRef.current;
    if (sphereRef.current) {
      const finalX = sphereRef.current.position.x;
      const finalY = sphereRef.current.position.y;
      const finalHdg = Math.atan2(finalY - geo.y, finalX - geo.x);
      onChange?.(idx, finalHdg);
    }
  }, []);

  const { startDrag } = useDragWithDeadZone({
    orbitControlsRef,
    createPlane,
    worldToLocal,
    onDragMove,
    onDragEnd: handleDragEnd,
  });

  const handlePointerDown = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; nativeEvent: PointerEvent }) => {
      e.stopPropagation();
      if (!onHeadingChange) return;
      startDrag(e.nativeEvent.clientX, e.nativeEvent.clientY);
    },
    [onHeadingChange, startDrag],
  );

  if (!selected) return null;

  return (
    <group>
      <line>
        <bufferGeometry attach="geometry" {...lineGeometry} />
        <lineBasicMaterial color="#9b84e8" opacity={0.6} transparent linewidth={1} />
      </line>
      <mesh
        ref={sphereRef}
        position={[endPos.x, endPos.y, endPos.z]}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => {
          setHovered(true);
          if (onHeadingChange) gl.domElement.style.cursor = 'grab';
        }}
        onPointerLeave={() => {
          setHovered(false);
          gl.domElement.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial
          color={hovered ? '#c8b8ff' : '#9b84e8'}
          emissive="#9b84e8"
          emissiveIntensity={hovered ? 0.5 : 0.3}
        />
      </mesh>
    </group>
  );
}
