/**
 * Arc curvature editing handle.
 * Displays a draggable sphere at the arc midpoint.
 * Dragging perpendicular to the heading changes the curvature.
 */

import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OdrGeometry } from '@osce/shared';
import { useDragWithDeadZone } from '../primitives/useDragWithDeadZone.js';

/** Evaluate arc at distance ds from start (same as packages/opendrive/src/geometry/arc.ts) */
function evaluateArcLocal(ds: number, geom: OdrGeometry): { x: number; y: number } {
  const k = geom.curvature ?? 0;
  const cosH0 = Math.cos(geom.hdg);
  const sinH0 = Math.sin(geom.hdg);

  let u: number;
  let v: number;

  if (Math.abs(k) < 1e-12) {
    u = ds;
    v = 0;
  } else {
    u = Math.sin(k * ds) / k;
    v = (1 - Math.cos(k * ds)) / k;
  }

  return {
    x: geom.x + u * cosH0 - v * sinH0,
    y: geom.y + u * sinH0 + v * cosH0,
  };
}

/** Maximum curvature magnitude (minimum radius = 1m) */
const MAX_CURVATURE = 1.0;

interface ArcCurvatureHandleProps {
  geometry: OdrGeometry;
  index: number;
  selected: boolean;
  onCurvatureChange?: (index: number, newCurvature: number) => void;
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
}

export function ArcCurvatureHandle({
  geometry,
  index,
  selected,
  onCurvatureChange,
  orbitControlsRef,
}: ArcCurvatureHandleProps) {
  const { gl } = useThree();
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const midpoint = useMemo(() => {
    const ds = geometry.length / 2;
    return evaluateArcLocal(ds, geometry);
  }, [geometry]);

  const propsRef = useRef({ geometry, index, onCurvatureChange });
  propsRef.current = { geometry, index, onCurvatureChange };

  const createPlane = useCallback(() => {
    const worldPos = new THREE.Vector3(midpoint.x, midpoint.y, 0);
    sphereRef.current?.localToWorld(worldPos);
    return new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldPos.y);
  }, [midpoint]);

  const worldToLocal = useCallback((intersection: THREE.Vector3) => {
    if (sphereRef.current?.parent) {
      sphereRef.current.parent.worldToLocal(intersection);
    }
  }, []);

  const onDragMove = useCallback((intersection: THREE.Vector3) => {
    const { geometry: geo } = propsRef.current;
    const originX = geo.x;
    const originY = geo.y;
    const hdg = geo.hdg;
    const len = geo.length;

    const baselineMidX = originX + Math.cos(hdg) * (len / 2);
    const baselineMidY = originY + Math.sin(hdg) * (len / 2);
    const perpX = -Math.sin(hdg);
    const perpY = Math.cos(hdg);
    const offsetX = intersection.x - baselineMidX;
    const offsetY = intersection.y - baselineMidY;
    const perpDist = offsetX * perpX + offsetY * perpY;

    let newCurvature = Math.abs(perpDist) < 1e-6 ? 0 : (8 * perpDist) / (len * len);
    newCurvature = Math.max(-MAX_CURVATURE, Math.min(MAX_CURVATURE, newCurvature));

    const previewMid = evaluateArcLocal(len / 2, { ...geo, curvature: newCurvature });
    if (sphereRef.current) {
      sphereRef.current.position.set(previewMid.x, previewMid.y, 0);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    const { geometry: geo, index: idx, onCurvatureChange: onChange } = propsRef.current;
    if (!sphereRef.current) return;

    const finalX = sphereRef.current.position.x;
    const finalY = sphereRef.current.position.y;
    const hdg = geo.hdg;
    const len = geo.length;

    const baselineMidX = geo.x + Math.cos(hdg) * (len / 2);
    const baselineMidY = geo.y + Math.sin(hdg) * (len / 2);
    const perpX = -Math.sin(hdg);
    const perpY = Math.cos(hdg);
    const offsetX = finalX - baselineMidX;
    const offsetY = finalY - baselineMidY;
    const perpDist = offsetX * perpX + offsetY * perpY;

    let finalCurvature = Math.abs(perpDist) < 1e-6 ? 0 : (8 * perpDist) / (len * len);
    finalCurvature = Math.max(-MAX_CURVATURE, Math.min(MAX_CURVATURE, finalCurvature));

    onChange?.(idx, finalCurvature);
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
      if (!onCurvatureChange) return;
      startDrag(e.nativeEvent.clientX, e.nativeEvent.clientY);
    },
    [onCurvatureChange, startDrag],
  );

  if (!selected || geometry.type !== 'arc') return null;

  return (
    <mesh
      ref={sphereRef}
      position={[midpoint.x, midpoint.y, 0]}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => {
        setHovered(true);
        if (onCurvatureChange) gl.domElement.style.cursor = 'grab';
      }}
      onPointerLeave={() => {
        setHovered(false);
        gl.domElement.style.cursor = 'default';
      }}
    >
      <sphereGeometry args={[0.4, 12, 12]} />
      <meshStandardMaterial
        color={hovered ? '#ffcc80' : '#ff9800'}
        emissive="#ff9800"
        emissiveIntensity={hovered ? 0.5 : 0.3}
      />
    </mesh>
  );
}
