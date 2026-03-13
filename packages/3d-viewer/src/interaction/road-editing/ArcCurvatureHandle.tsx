/**
 * Arc curvature editing handle.
 * Displays a draggable sphere at the arc midpoint.
 * Dragging perpendicular to the heading changes the curvature.
 */

import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OdrGeometry } from '@osce/shared';

interface ArcCurvatureHandleProps {
  /** Arc geometry segment */
  geometry: OdrGeometry;
  /** Index in the road's planView array */
  index: number;
  /** Whether this geometry segment is selected */
  selected: boolean;
  /** Callback when curvature changes via drag */
  onCurvatureChange?: (index: number, newCurvature: number) => void;
  /** Ref to OrbitControls (to disable during drag) */
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
}

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

export function ArcCurvatureHandle({
  geometry,
  index,
  selected,
  onCurvatureChange,
  orbitControlsRef,
}: ArcCurvatureHandleProps) {
  const { gl, camera } = useThree();
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isDragging = useRef(false);

  // Compute midpoint of the arc
  const midpoint = useMemo(() => {
    const ds = geometry.length / 2;
    return evaluateArcLocal(ds, geometry);
  }, [geometry]);

  // Drag handler: move perpendicular to heading to change curvature
  const handlePointerDown = useCallback(
    (e: THREE.Event & { stopPropagation: () => void; nativeEvent: PointerEvent }) => {
      e.stopPropagation();
      if (!onCurvatureChange) return;

      isDragging.current = false;

      const startClientX = e.nativeEvent.clientX;
      const startClientY = e.nativeEvent.clientY;

      // Create horizontal plane at sphere elevation
      const worldPos = new THREE.Vector3(midpoint.x, midpoint.y, 0);
      sphereRef.current?.localToWorld(worldPos);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldPos.y);

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const originX = geometry.x;
      const originY = geometry.y;
      const hdg = geometry.hdg;
      const len = geometry.length;

      const handleMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startClientX;
        const dy = ev.clientY - startClientY;
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
          if (sphereRef.current?.parent) {
            sphereRef.current.parent.worldToLocal(intersection);
          }

          // Compute perpendicular offset from the baseline (straight line from start to midpoint-along-heading)
          const baselineMidX = originX + Math.cos(hdg) * (len / 2);
          const baselineMidY = originY + Math.sin(hdg) * (len / 2);

          // Perpendicular direction (left of heading)
          const perpX = -Math.sin(hdg);
          const perpY = Math.cos(hdg);

          // Project intersection point offset onto perpendicular
          const offsetX = intersection.x - baselineMidX;
          const offsetY = intersection.y - baselineMidY;
          const perpDist = offsetX * perpX + offsetY * perpY;

          // Approximate curvature from perpendicular deflection at midpoint:
          // For a circular arc, the sag (perpendicular deflection at midpoint) is:
          // sag = (1 - cos(k*L/2)) / k ≈ k*L²/8 for small curvature
          // So k ≈ 8*sag / L²
          let newCurvature: number;
          if (Math.abs(perpDist) < 1e-6) {
            newCurvature = 0;
          } else {
            newCurvature = (8 * perpDist) / (len * len);
          }

          // Clamp curvature
          newCurvature = Math.max(-MAX_CURVATURE, Math.min(MAX_CURVATURE, newCurvature));

          // Preview: update sphere position to the new arc midpoint
          const previewMid = evaluateArcLocal(len / 2, {
            ...geometry,
            curvature: newCurvature,
          });
          if (sphereRef.current) {
            sphereRef.current.position.set(previewMid.x, previewMid.y, 0);
          }
        }
      };

      const handleUp = (_ev: PointerEvent) => {
        gl.domElement.removeEventListener('pointermove', handleMove);
        gl.domElement.removeEventListener('pointerup', handleUp);

        if (orbitControlsRef?.current) orbitControlsRef.current.enabled = true;

        if (isDragging.current && sphereRef.current) {
          // Recompute curvature from final sphere position
          const finalX = sphereRef.current.position.x;
          const finalY = sphereRef.current.position.y;

          const baselineMidX = originX + Math.cos(hdg) * (len / 2);
          const baselineMidY = originY + Math.sin(hdg) * (len / 2);
          const perpX = -Math.sin(hdg);
          const perpY = Math.cos(hdg);
          const offsetX = finalX - baselineMidX;
          const offsetY = finalY - baselineMidY;
          const perpDist = offsetX * perpX + offsetY * perpY;

          let finalCurvature = Math.abs(perpDist) < 1e-6 ? 0 : (8 * perpDist) / (len * len);
          finalCurvature = Math.max(-MAX_CURVATURE, Math.min(MAX_CURVATURE, finalCurvature));

          onCurvatureChange(index, finalCurvature);
        }

        isDragging.current = false;
      };

      gl.domElement.addEventListener('pointermove', handleMove);
      gl.domElement.addEventListener('pointerup', handleUp);
    },
    [geometry, midpoint, index, onCurvatureChange, orbitControlsRef, gl, camera],
  );

  // Only show for selected arc segments
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
