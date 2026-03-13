/**
 * Draggable sphere gizmo at a geometry segment's start position.
 * Uses horizontal-plane raycasting for drag tracking (same pattern as RoadGizmo).
 *
 * Editable types (line, arc, spiral) → accent color, draggable.
 * Read-only types (poly3, paramPoly3) → gray, non-draggable.
 */

import React, { useRef, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OdrGeometry } from '@osce/shared';

const EDITABLE_TYPES = new Set(['line', 'arc', 'spiral']);

interface ControlPointGizmoProps {
  /** Geometry segment data */
  geometry: OdrGeometry;
  /** Index in the road's planView array */
  index: number;
  /** Whether this control point is currently selected */
  selected: boolean;
  /** Callback when clicked */
  onClick: (index: number) => void;
  /** Callback when drag ends with new position */
  onDragEnd?: (index: number, newX: number, newY: number) => void;
  /** Ref to OrbitControls (to disable during drag) */
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
}

export function ControlPointGizmo({
  geometry,
  index,
  selected,
  onClick,
  onDragEnd,
  orbitControlsRef,
}: ControlPointGizmoProps) {
  const { gl, camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const isEditable = EDITABLE_TYPES.has(geometry.type);
  const isDragging = useRef(false);

  // Colors
  const baseColor = isEditable
    ? selected
      ? '#c8b8ff' // accent bright
      : '#9b84e8' // accent
    : '#555'; // gray for read-only
  const hoverColor = isEditable ? '#e0d4ff' : '#666';

  const radius = selected ? 0.7 : 0.5;

  // Position in OpenDRIVE coords (inside the rotation group, x/y/z maps directly)
  const position: [number, number, number] = [geometry.x, geometry.y, 0];

  const handlePointerDown = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; nativeEvent: PointerEvent }) => {
      e.stopPropagation();
      onClick(index);

      if (!isEditable || !onDragEnd) return;

      // Start drag tracking on DOM
      isDragging.current = false;

      const startX = e.nativeEvent.clientX;
      const startY = e.nativeEvent.clientY;

      // Create horizontal plane at the control point's elevation (y=0 in Three.js local)
      const worldPos = new THREE.Vector3(...position);
      meshRef.current?.localToWorld(worldPos);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldPos.y);

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!isDragging.current && dx * dx + dy * dy > 9) {
          isDragging.current = true;
          if (orbitControlsRef?.current) orbitControlsRef.current.enabled = false;
        }

        if (!isDragging.current) return;

        const rect = gl.domElement.getBoundingClientRect();
        mouse.set(
          ((ev.clientX - rect.left) / rect.width) * 2 - 1,
          -((ev.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(mouse, camera);
        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          // Convert Three.js world back to OpenDRIVE coords
          // Inside the rotation group: local x = odr x, local y = odr y
          if (meshRef.current?.parent) {
            meshRef.current.parent.worldToLocal(intersection);
          }
          // Update position preview during drag
          if (meshRef.current) {
            meshRef.current.position.set(intersection.x, intersection.y, 0);
          }
        }
      };

      const handleUp = (_ev: PointerEvent) => {
        gl.domElement.removeEventListener('pointermove', handleMove);
        gl.domElement.removeEventListener('pointerup', handleUp);

        if (orbitControlsRef?.current) orbitControlsRef.current.enabled = true;

        if (isDragging.current) {
          // Get final position from mesh
          const finalX = meshRef.current?.position.x ?? geometry.x;
          const finalY = meshRef.current?.position.y ?? geometry.y;
          onDragEnd(index, finalX, finalY);
        }

        isDragging.current = false;
      };

      gl.domElement.addEventListener('pointermove', handleMove);
      gl.domElement.addEventListener('pointerup', handleUp);
    },
    [geometry, index, isEditable, onClick, onDragEnd, orbitControlsRef, gl, camera, position],
  );

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => {
        setHovered(true);
        gl.domElement.style.cursor = isEditable ? 'grab' : 'default';
      }}
      onPointerLeave={() => {
        setHovered(false);
        gl.domElement.style.cursor = 'default';
      }}
    >
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial
        color={hovered ? hoverColor : baseColor}
        emissive={selected ? baseColor : '#000'}
        emissiveIntensity={selected ? 0.4 : 0}
        transparent
        opacity={isEditable ? 1 : 0.5}
      />
    </mesh>
  );
}
