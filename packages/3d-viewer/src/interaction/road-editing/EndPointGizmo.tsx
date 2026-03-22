/**
 * Draggable gizmo at a geometry segment's end position.
 * Uses horizontal-plane raycasting for drag tracking.
 *
 * For line segments: dragging recomputes hdg + length.
 * For arc segments: dragging recomputes curvature + length (keeping start hdg fixed).
 * Only shown for editable types (line, arc).
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OdrGeometry, OpenDriveDocument } from '@osce/shared';
import { computeEndpoint, solveFromEndpoint, solveFromEndpointWithHeading } from './geometry-solve.js';
import { snapToEndpoint, computeAlignedHeading } from './snap-utils.js';

const EDITABLE_TYPES = new Set(['line', 'arc']);

interface EndPointGizmoProps {
  /** Geometry segment data */
  geometry: OdrGeometry;
  /** Index in the road's planView array */
  index: number;
  /** Whether this geometry segment is currently selected */
  selected: boolean;
  /** Callback when drag ends with new geometry properties */
  onDragEnd?: (
    index: number,
    updates: { hdg?: number; length: number; curvature?: number },
  ) => void;
  /** Callback when Ctrl+drag ends (translate whole segment) */
  onTranslateDragEnd?: (index: number, newX: number, newY: number) => void;
  /** Ref to OrbitControls (to disable during drag) */
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
  /** Full OpenDRIVE document (for endpoint snapping) */
  openDriveDocument?: OpenDriveDocument;
  /** ID of the road this gizmo belongs to */
  roadId?: string;
  /** Whether this is the last geometry segment (road end = successor) */
  isLastGeometry?: boolean;
  /** Callback when endpoint snaps to another road's endpoint */
  onSnapLink?: (
    roadId: string,
    linkType: 'predecessor' | 'successor',
    targetRoadId: string,
    targetContactPoint: 'start' | 'end',
  ) => void;
  /** Callback when endpoint is dragged away from a snapped position (unsnap) */
  onSnapUnlink?: (roadId: string, linkType: 'predecessor' | 'successor') => void;
}

export function EndPointGizmo({
  geometry,
  index,
  selected,
  onDragEnd,
  onTranslateDragEnd,
  orbitControlsRef,
  openDriveDocument,
  roadId,
  isLastGeometry,
  onSnapLink,
  onSnapUnlink,
}: EndPointGizmoProps) {
  const { gl, camera } = useThree();
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const isEditable = EDITABLE_TYPES.has(geometry.type);
  const isDragging = useRef(false);

  // Compute endpoint position
  const endPos = useMemo(() => computeEndpoint(geometry), [geometry]);
  const position: [number, number, number] = [endPos[0], endPos[1], 0];

  // Colors — use a warm/orange tone to distinguish from start point (purple)
  const baseColor = selected ? '#ffb86c' : '#e89b4e';
  const hoverColor = '#ffd9a8';

  const radius = selected ? 1.0 : 0.8;
  const hitRadius = 1.5; // Invisible larger hit area

  const handlePointerDown = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; nativeEvent: PointerEvent }) => {
      e.stopPropagation();
      if (!isEditable || !onDragEnd) return;

      isDragging.current = false;

      const startX = e.nativeEvent.clientX;
      const startY = e.nativeEvent.clientY;

      const worldPos = new THREE.Vector3(...position);
      meshRef.current?.localToWorld(worldPos);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldPos.y);

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleMove = (ev: PointerEvent) => {
        const dxScreen = ev.clientX - startX;
        const dyScreen = ev.clientY - startY;
        if (!isDragging.current && dxScreen * dxScreen + dyScreen * dyScreen > 9) {
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
          // Snap to nearby endpoint during drag (visual feedback)
          if (isLastGeometry && openDriveDocument && roadId) {
            const snap = snapToEndpoint(intersection.x, intersection.y, openDriveDocument, roadId);
            if (snap.snapped) {
              intersection.x = snap.x;
              intersection.y = snap.y;
            }
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
          const finalX = meshRef.current?.position.x ?? endPos[0];
          const finalY = meshRef.current?.position.y ?? endPos[1];

          if (ev.ctrlKey || ev.metaKey) {
            // Ctrl+drag: translate whole segment (move start by same delta as endpoint)
            const deltaX = finalX - endPos[0];
            const deltaY = finalY - endPos[1];
            onTranslateDragEnd?.(index, geometry.x + deltaX, geometry.y + deltaY);
          } else if (isLastGeometry && openDriveDocument && roadId) {
            // Last geometry: check snap first, then solve with heading alignment
            const snap = snapToEndpoint(finalX, finalY, openDriveDocument, roadId);
            if (snap.snapped && snap.snapRoadId && snap.snapContactPoint && snap.snapHeading !== undefined) {
              const alignedHdg = computeAlignedHeading('end', snap.snapContactPoint, snap.snapHeading);
              const updates = solveFromEndpointWithHeading(geometry, snap.x, snap.y, alignedHdg);
              onDragEnd?.(index, updates);
              onSnapLink?.(roadId, 'successor', snap.snapRoadId, snap.snapContactPoint);
            } else {
              const updates = solveFromEndpoint(geometry, finalX, finalY);
              onDragEnd?.(index, updates);
              // Dragged away from snap — clear existing link
              onSnapUnlink?.(roadId, 'successor');
            }
          } else {
            // Non-last geometry: normal solve
            const updates = solveFromEndpoint(geometry, finalX, finalY);
            onDragEnd?.(index, updates);
          }
        }

        isDragging.current = false;
      };

      gl.domElement.addEventListener('pointermove', handleMove);
      gl.domElement.addEventListener('pointerup', handleUp);
    },
    [geometry, index, isEditable, onDragEnd, onTranslateDragEnd, orbitControlsRef, gl, camera, position, endPos, isLastGeometry, openDriveDocument, roadId, onSnapLink, onSnapUnlink],
  );

  if (!isEditable) return null;

  return (
    <group
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => {
        setHovered(true);
        gl.domElement.style.cursor = 'grab';
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
