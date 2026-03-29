/**
 * Draggable gizmo at a geometry segment's end position.
 * Uses useDragWithDeadZone for horizontal-plane raycasting.
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
import { useDragWithDeadZone } from '../primitives/useDragWithDeadZone.js';

const EDITABLE_TYPES = new Set(['line', 'arc']);

interface EndPointGizmoProps {
  geometry: OdrGeometry;
  index: number;
  selected: boolean;
  onDragEnd?: (
    index: number,
    updates: { hdg?: number; length: number; curvature?: number },
  ) => void;
  onTranslateDragEnd?: (index: number, newX: number, newY: number) => void;
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
  openDriveDocument?: OpenDriveDocument;
  roadId?: string;
  isLastGeometry?: boolean;
  onSnapLink?: (
    roadId: string,
    linkType: 'predecessor' | 'successor',
    targetRoadId: string,
    targetContactPoint: 'start' | 'end',
  ) => void;
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
  const { gl } = useThree();
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const lastPointerEventRef = useRef<PointerEvent | null>(null);

  const isEditable = EDITABLE_TYPES.has(geometry.type);
  const endPos = useMemo(() => computeEndpoint(geometry), [geometry]);
  const position: [number, number, number] = [endPos[0], endPos[1], 0];

  const baseColor = selected ? '#ffb86c' : '#e89b4e';
  const hoverColor = '#ffd9a8';
  const radius = selected ? 1.0 : 0.8;
  const hitRadius = 1.5;

  const propsRef = useRef({ geometry, index, endPos, isLastGeometry, openDriveDocument, roadId, onDragEnd, onTranslateDragEnd, onSnapLink, onSnapUnlink });
  propsRef.current = { geometry, index, endPos, isLastGeometry, openDriveDocument, roadId, onDragEnd, onTranslateDragEnd, onSnapLink, onSnapUnlink };

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
    const { isLastGeometry: isLast, openDriveDocument: odr, roadId: rId } = propsRef.current;
    if (isLast && odr && rId) {
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
    const { geometry: geo, index: idx, endPos: ep, isLastGeometry: isLast, openDriveDocument: odr, roadId: rId, onDragEnd: onEnd, onTranslateDragEnd: onTranslate, onSnapLink: onLink, onSnapUnlink: onUnlink } = propsRef.current;
    const ev = lastPointerEventRef.current;

    const finalX = meshRef.current?.position.x ?? ep[0];
    const finalY = meshRef.current?.position.y ?? ep[1];

    if (ev && (ev.ctrlKey || ev.metaKey)) {
      const deltaX = finalX - ep[0];
      const deltaY = finalY - ep[1];
      onTranslate?.(idx, geo.x + deltaX, geo.y + deltaY);
    } else if (isLast && odr && rId) {
      const snap = snapToEndpoint(finalX, finalY, odr, rId);
      if (snap.snapped && snap.snapRoadId && snap.snapContactPoint && snap.snapHeading !== undefined) {
        const alignedHdg = computeAlignedHeading('end', snap.snapContactPoint, snap.snapHeading);
        const updates = solveFromEndpointWithHeading(geo, snap.x, snap.y, alignedHdg);
        onEnd?.(idx, updates);
        onLink?.(rId, 'successor', snap.snapRoadId, snap.snapContactPoint);
      } else {
        const updates = solveFromEndpoint(geo, finalX, finalY);
        onEnd?.(idx, updates);
        onUnlink?.(rId, 'successor');
      }
    } else {
      const updates = solveFromEndpoint(geo, finalX, finalY);
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
      if (!isEditable || !onDragEnd) return;

      lastPointerEventRef.current = e.nativeEvent;
      const canvas = gl.domElement;
      const captureUp = (ev: PointerEvent) => {
        lastPointerEventRef.current = ev;
        canvas.removeEventListener('pointerup', captureUp);
      };
      canvas.addEventListener('pointerup', captureUp);

      startDrag(e.nativeEvent.clientX, e.nativeEvent.clientY);
    },
    [isEditable, onDragEnd, startDrag, gl],
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
      <mesh>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? hoverColor : baseColor}
          emissive={selected ? baseColor : '#000'}
          emissiveIntensity={selected ? 0.4 : 0}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[hitRadius, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
