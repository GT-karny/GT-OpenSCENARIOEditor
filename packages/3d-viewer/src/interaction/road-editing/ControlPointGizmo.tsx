/**
 * Draggable sphere gizmo at a geometry segment's start position.
 * Uses horizontal-plane raycasting for drag tracking.
 *
 * Default drag: reshape — keep endpoint fixed, solve new hdg/length from new start.
 * Ctrl+drag: translate — move the whole segment (only x,y change).
 *
 * Editable types (line, arc) → accent color, draggable.
 * Read-only types (poly3, paramPoly3, spiral) → gray, non-draggable.
 */

import React, { useRef, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OdrGeometry, OpenDriveDocument } from '@osce/shared';
import { solveFromStartpoint } from './geometry-solve.js';
import { snapToEndpoint } from './snap-utils.js';

const EDITABLE_TYPES = new Set(['line', 'arc']);

interface ControlPointGizmoProps {
  /** Geometry segment data */
  geometry: OdrGeometry;
  /** Index in the road's planView array */
  index: number;
  /** Whether this control point is currently selected */
  selected: boolean;
  /** Callback when clicked (normal click) */
  onClick: (index: number) => void;
  /** Callback when Shift+clicked for multi-selection */
  onShiftClick?: (index: number) => void;
  /** Callback when drag ends — reshape mode (keep endpoint fixed) */
  onDragEnd?: (
    index: number,
    updates: { x: number; y: number; hdg: number; length: number; curvature?: number },
  ) => void;
  /** Callback when Ctrl+drag ends — translate mode (only x,y change) */
  onTranslateDragEnd?: (index: number, newX: number, newY: number) => void;
  /** Ref to OrbitControls (to disable during drag) */
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
  /** Full OpenDRIVE document (for endpoint snapping) */
  openDriveDocument?: OpenDriveDocument;
  /** ID of the road this gizmo belongs to */
  roadId?: string;
  /** Callback when start point snaps to another road's endpoint */
  onSnapLink?: (
    roadId: string,
    linkType: 'predecessor' | 'successor',
    targetRoadId: string,
    targetContactPoint: 'start' | 'end',
  ) => void;
}

export function ControlPointGizmo({
  geometry,
  index,
  selected,
  onClick,
  onShiftClick,
  onDragEnd,
  onTranslateDragEnd,
  orbitControlsRef,
  openDriveDocument,
  roadId,
  onSnapLink,
}: ControlPointGizmoProps) {
  const { gl, camera } = useThree();
  const meshRef = useRef<THREE.Group>(null);
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

  const radius = selected ? 1.0 : 0.8;
  const hitRadius = 1.5;

  // Position in OpenDRIVE coords (inside the rotation group, x/y/z maps directly)
  const position: [number, number, number] = [geometry.x, geometry.y, 0];

  const handlePointerDown = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; nativeEvent: PointerEvent }) => {
      e.stopPropagation();
      if (e.nativeEvent.shiftKey && onShiftClick) {
        onShiftClick(index);
        return;
      }
      onClick(index);

      if (!isEditable) return;

      isDragging.current = false;

      const startX = e.nativeEvent.clientX;
      const startY = e.nativeEvent.clientY;

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
          if (meshRef.current?.parent) {
            meshRef.current.parent.worldToLocal(intersection);
          }
          if (meshRef.current) {
            meshRef.current.position.set(intersection.x, intersection.y, 0);
          }
        }
      };

      const handleUp = (ev: PointerEvent) => {
        gl.domElement.removeEventListener('pointermove', handleMove);
        gl.domElement.removeEventListener('pointerup', handleUp);

        if (orbitControlsRef?.current) orbitControlsRef.current.enabled = true;

        if (isDragging.current) {
          const finalX = meshRef.current?.position.x ?? geometry.x;
          const finalY = meshRef.current?.position.y ?? geometry.y;

          if (ev.ctrlKey || ev.metaKey) {
            // Ctrl+drag: translate (move only x,y, keep hdg/length/curvature)
            onTranslateDragEnd?.(index, finalX, finalY);
          } else {
            // Normal drag: reshape (keep endpoint fixed, solve geometry)
            const updates = solveFromStartpoint(geometry, finalX, finalY);
            onDragEnd?.(index, updates);
          }

          // Check for snap link (only for index 0 = road start point)
          if (index === 0 && openDriveDocument && roadId && onSnapLink) {
            const snap = snapToEndpoint(finalX, finalY, openDriveDocument, roadId);
            if (snap.snapped && snap.snapRoadId && snap.snapContactPoint) {
              onSnapLink(roadId, 'predecessor', snap.snapRoadId, snap.snapContactPoint);
            }
          }
        }

        isDragging.current = false;
      };

      gl.domElement.addEventListener('pointermove', handleMove);
      gl.domElement.addEventListener('pointerup', handleUp);
    },
    [geometry, index, isEditable, onClick, onShiftClick, onDragEnd, onTranslateDragEnd, orbitControlsRef, gl, camera, position, openDriveDocument, roadId, onSnapLink],
  );

  return (
    <group
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
      {/* Visible sphere */}
      <mesh>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? hoverColor : baseColor}
          emissive={selected ? baseColor : '#000'}
          emissiveIntensity={selected ? 0.4 : 0}
          transparent
          opacity={isEditable ? 1 : 0.5}
        />
      </mesh>
      {/* Invisible larger hit area */}
      <mesh>
        <sphereGeometry args={[hitRadius, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
