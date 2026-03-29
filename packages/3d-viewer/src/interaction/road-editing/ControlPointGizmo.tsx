/**
 * Draggable sphere gizmo at a geometry segment's start position.
 * Uses useDragWithDeadZone for horizontal-plane raycasting.
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
import { solveFromStartpoint, solveFromStartpointWithHeading } from './geometry-solve.js';
import { snapToEndpoint, computeAlignedHeading } from './snap-utils.js';
import { useDragWithDeadZone } from '../primitives/useDragWithDeadZone.js';

const EDITABLE_TYPES = new Set(['line', 'arc']);

interface ControlPointGizmoProps {
  geometry: OdrGeometry;
  index: number;
  selected: boolean;
  onClick: (index: number) => void;
  onShiftClick?: (index: number) => void;
  onDragEnd?: (
    index: number,
    updates: { x: number; y: number; hdg: number; length: number; curvature?: number },
  ) => void;
  onTranslateDragEnd?: (index: number, newX: number, newY: number) => void;
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
  openDriveDocument?: OpenDriveDocument;
  roadId?: string;
  onSnapLink?: (
    roadId: string,
    linkType: 'predecessor' | 'successor',
    targetRoadId: string,
    targetContactPoint: 'start' | 'end',
  ) => void;
  onSnapUnlink?: (roadId: string, linkType: 'predecessor' | 'successor') => void;
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
  onSnapUnlink,
}: ControlPointGizmoProps) {
  const { gl } = useThree();
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const lastPointerEventRef = useRef<PointerEvent | null>(null);

  const isEditable = EDITABLE_TYPES.has(geometry.type);

  const baseColor = isEditable
    ? selected
      ? '#c8b8ff'
      : '#9b84e8'
    : '#555';
  const hoverColor = isEditable ? '#e0d4ff' : '#666';

  const radius = selected ? 1.0 : 0.8;
  const hitRadius = 1.5;
  const position: [number, number, number] = [geometry.x, geometry.y, 0];

  // Keep latest props in ref for callbacks
  const propsRef = useRef({ geometry, index, openDriveDocument, roadId, onDragEnd, onTranslateDragEnd, onSnapLink, onSnapUnlink });
  propsRef.current = { geometry, index, openDriveDocument, roadId, onDragEnd, onTranslateDragEnd, onSnapLink, onSnapUnlink };

  const createPlane = useCallback(() => {
    const worldPos = new THREE.Vector3(...position);
    meshRef.current?.localToWorld(worldPos);
    return new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldPos.y);
  }, [position]);

  const worldToLocal = useCallback((intersection: THREE.Vector3) => {
    if (meshRef.current?.parent) {
      meshRef.current.parent.worldToLocal(intersection);
    }
  }, []);

  const onDragMove = useCallback((intersection: THREE.Vector3) => {
    const { index: idx, openDriveDocument: odr, roadId: rId } = propsRef.current;
    // Snap to nearby endpoint during drag (visual feedback)
    if (idx === 0 && odr && rId) {
      const snap = snapToEndpoint(intersection.x, intersection.y, odr, rId);
      if (snap.snapped) {
        intersection.x = snap.x;
        intersection.y = snap.y;
      }
    }
    if (meshRef.current) {
      meshRef.current.position.set(intersection.x, intersection.y, 0);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    const { geometry: geo, index: idx, openDriveDocument: odr, roadId: rId, onDragEnd: onEnd, onTranslateDragEnd: onTranslate, onSnapLink: onLink, onSnapUnlink: onUnlink } = propsRef.current;
    const ev = lastPointerEventRef.current;

    const finalX = meshRef.current?.position.x ?? geo.x;
    const finalY = meshRef.current?.position.y ?? geo.y;

    if (ev && (ev.ctrlKey || ev.metaKey)) {
      onTranslate?.(idx, finalX, finalY);
    } else if (idx === 0 && odr && rId) {
      const snap = snapToEndpoint(finalX, finalY, odr, rId);
      if (snap.snapped && snap.snapRoadId && snap.snapContactPoint && snap.snapHeading !== undefined) {
        const alignedHdg = computeAlignedHeading('start', snap.snapContactPoint, snap.snapHeading);
        const updates = solveFromStartpointWithHeading(geo, snap.x, snap.y, alignedHdg);
        onEnd?.(idx, updates);
        onLink?.(rId, 'predecessor', snap.snapRoadId, snap.snapContactPoint);
      } else {
        const updates = solveFromStartpoint(geo, finalX, finalY);
        onEnd?.(idx, updates);
        onUnlink?.(rId, 'predecessor');
      }
    } else {
      const updates = solveFromStartpoint(geo, finalX, finalY);
      onEnd?.(idx, updates);
    }

    lastPointerEventRef.current = null;
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
      if (e.nativeEvent.shiftKey && onShiftClick) {
        onShiftClick(index);
        return;
      }
      onClick(index);

      if (!isEditable) return;

      lastPointerEventRef.current = e.nativeEvent;

      // Capture pointerup event for Ctrl key detection
      const canvas = gl.domElement;
      const captureUp = (ev: PointerEvent) => {
        lastPointerEventRef.current = ev;
        canvas.removeEventListener('pointerup', captureUp);
      };
      canvas.addEventListener('pointerup', captureUp);

      startDrag(e.nativeEvent.clientX, e.nativeEvent.clientY);
    },
    [index, isEditable, onClick, onShiftClick, startDrag, gl],
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
      <mesh>
        <sphereGeometry args={[hitRadius, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
