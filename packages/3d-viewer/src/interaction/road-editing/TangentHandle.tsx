/**
 * Tangent direction handle extending from a control point.
 * Shows the heading direction as a line + draggable sphere.
 * Dragging the endpoint sphere rotates the heading of the geometry segment.
 */

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OdrGeometry } from '@osce/shared';

interface TangentHandleProps {
  /** Geometry segment data */
  geometry: OdrGeometry;
  /** Index in the road's planView array */
  index: number;
  /** Whether the parent control point is selected */
  selected: boolean;
  /** Handle length in meters */
  handleLength?: number;
  /** Callback when heading is changed via drag */
  onHeadingChange?: (index: number, newHdg: number) => void;
  /** Ref to OrbitControls (to disable during drag) */
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
  const { gl, camera } = useThree();
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isDragging = useRef(false);
  const activeMoveRef = useRef<((e: PointerEvent) => void) | null>(null);
  const activeUpRef = useRef<((e: PointerEvent) => void) | null>(null);

  // Compute tangent endpoint in OpenDRIVE coords
  const { endPos, linePoints } = useMemo(() => {
    const sx = geometry.x;
    const sy = geometry.y;
    const hdg = geometry.hdg;

    // Tangent direction: heading angle from x-axis
    const ex = sx + Math.cos(hdg) * handleLength;
    const ey = sy + Math.sin(hdg) * handleLength;

    const start = new THREE.Vector3(sx, sy, 0);
    const end = new THREE.Vector3(ex, ey, 0);

    return {
      startPos: start,
      endPos: end,
      linePoints: [start, end],
    };
  }, [geometry.x, geometry.y, geometry.hdg, handleLength]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(linePoints);
    return geo;
  }, [linePoints]);

  // Drag handler for heading rotation (same pattern as ControlPointGizmo)
  const handlePointerDown = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; nativeEvent: PointerEvent }) => {
      e.stopPropagation();
      if (!onHeadingChange) return;

      isDragging.current = false;

      const startX = e.nativeEvent.clientX;
      const startY = e.nativeEvent.clientY;

      // Create horizontal plane at the sphere's elevation
      const worldPos = new THREE.Vector3(endPos.x, endPos.y, endPos.z);
      sphereRef.current?.localToWorld(worldPos);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldPos.y);

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      // Geometry origin in OpenDRIVE coords
      const originX = geometry.x;
      const originY = geometry.y;

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
          // Convert world coords back to OpenDRIVE local coords
          if (sphereRef.current?.parent) {
            sphereRef.current.parent.worldToLocal(intersection);
          }
          // Compute new heading from origin to intersection point
          const newHdg = Math.atan2(intersection.y - originY, intersection.x - originX);

          // Update sphere position preview during drag
          const previewX = originX + Math.cos(newHdg) * handleLength;
          const previewY = originY + Math.sin(newHdg) * handleLength;
          if (sphereRef.current) {
            sphereRef.current.position.set(previewX, previewY, 0);
          }
        }
      };

      const handleUp = (_ev: PointerEvent) => {
        gl.domElement.removeEventListener('pointermove', handleMove);
        gl.domElement.removeEventListener('pointerup', handleUp);

        if (orbitControlsRef?.current) orbitControlsRef.current.enabled = true;

        if (isDragging.current && sphereRef.current) {
          // Compute final heading from the sphere's current position
          const finalX = sphereRef.current.position.x;
          const finalY = sphereRef.current.position.y;
          const finalHdg = Math.atan2(finalY - originY, finalX - originX);
          onHeadingChange(index, finalHdg);
        }

        isDragging.current = false;
      };

      activeMoveRef.current = handleMove;
      activeUpRef.current = handleUp;
      gl.domElement.addEventListener('pointermove', handleMove);
      gl.domElement.addEventListener('pointerup', handleUp);
    },
    [geometry.x, geometry.y, endPos, index, handleLength, onHeadingChange, orbitControlsRef, gl, camera],
  );

  // Cleanup listeners on unmount to prevent leaks during mid-drag unmount
  useEffect(() => {
    return () => {
      if (activeMoveRef.current) gl.domElement.removeEventListener('pointermove', activeMoveRef.current);
      if (activeUpRef.current) gl.domElement.removeEventListener('pointerup', activeUpRef.current);
      if (orbitControlsRef?.current) orbitControlsRef.current.enabled = true;
    };
  }, [gl, orbitControlsRef]);

  if (!selected) return null;

  return (
    <group>
      {/* Tangent line */}
      <line>
        <bufferGeometry attach="geometry" {...lineGeometry} />
        <lineBasicMaterial color="#9b84e8" opacity={0.6} transparent linewidth={1} />
      </line>

      {/* Endpoint sphere (draggable for heading rotation) */}
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
