/**
 * Visual markers for lane section boundaries.
 * Shows dashed lines at section splits and drag handles for boundary movement.
 * Uses DOM-level pointer events with manual raycasting against handle spheres.
 */

import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { OpenDriveDocument, OdrRoad } from '@osce/shared';
import { evaluateReferenceLineAtS } from '@osce/opendrive';

interface SectionBoundaryMarkersProps {
  active: boolean;
  openDriveDocument: OpenDriveDocument;
  roadId: string | null;
  onBoundaryDragEnd?: (roadId: string, sectionIdx: number, newS: number) => void;
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
}

interface BoundaryData {
  s: number;
  sectionIdx: number;
  points: [number, number, number][];
  center: [number, number, number];
}

const MIN_SECTION_LENGTH = 1;
const HANDLE_RADIUS = 0.4;

function computeBoundaryFromPose(
  road: OdrRoad,
  sectionIdx: number,
  s: number,
): { points: [number, number, number][]; center: [number, number, number] } | null {
  if (road.planView.length === 0) return null;

  const section = road.lanes[sectionIdx];
  if (!section) return null;

  const pose = evaluateReferenceLineAtS(road.planView, s);
  const perpX = -Math.sin(pose.hdg);
  const perpY = Math.cos(pose.hdg);

  const leftWidth = Math.max(section.leftLanes.length * 3.5, 1.0);
  const rightWidth = Math.max(section.rightLanes.length * 3.5, 1.0);

  const rightEdge: [number, number, number] = [
    pose.x - perpX * rightWidth, pose.y - perpY * rightWidth, 0.05,
  ];
  const leftEdge: [number, number, number] = [
    pose.x + perpX * leftWidth, pose.y + perpY * leftWidth, 0.05,
  ];
  const center: [number, number, number] = [
    (rightEdge[0] + leftEdge[0]) / 2,
    (rightEdge[1] + leftEdge[1]) / 2,
    0.5,
  ];

  return { points: [rightEdge, leftEdge], center };
}

function computeBoundary(road: OdrRoad, sectionIdx: number, s: number): BoundaryData | null {
  const result = computeBoundaryFromPose(road, sectionIdx, s);
  if (!result) return null;
  return { s, sectionIdx, ...result };
}

function computeBoundaryAtS(
  road: OdrRoad,
  sectionIdx: number,
  s: number,
): { points: [number, number, number][]; center: [number, number, number] } | null {
  return computeBoundaryFromPose(road, sectionIdx, s);
}

function getSectionEnd(road: OdrRoad, sectionIdx: number): number {
  const next = road.lanes[sectionIdx + 1];
  return next ? next.s : road.length;
}

function clampBoundaryS(road: OdrRoad, sectionIdx: number, newS: number): number {
  const prevStart = road.lanes[sectionIdx - 1]?.s ?? 0;
  const nextEnd = getSectionEnd(road, sectionIdx);
  const minS = prevStart + MIN_SECTION_LENGTH;
  const maxS = nextEnd - MIN_SECTION_LENGTH;
  return Math.max(minS, Math.min(maxS, newS));
}

/** Project pointer to closest s on road via coarse sampling + ternary search */
function projectToRoadS(
  road: OdrRoad,
  wx: number,
  wy: number,
): number {
  const coarseStep = Math.max(1, road.length / 100);
  let bestS = 0;
  let bestDistSq = Infinity;

  for (let s = 0; s <= road.length; s += coarseStep) {
    const pose = evaluateReferenceLineAtS(road.planView, s);
    const dx = wx - pose.x;
    const dy = wy - pose.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestS = s;
    }
  }

  let lo = Math.max(0, bestS - coarseStep);
  let hi = Math.min(road.length, bestS + coarseStep);
  for (let iter = 0; iter < 10; iter++) {
    const mid1 = lo + (hi - lo) / 3;
    const mid2 = hi - (hi - lo) / 3;
    const pose1 = evaluateReferenceLineAtS(road.planView, mid1);
    const pose2 = evaluateReferenceLineAtS(road.planView, mid2);
    const d1 = (wx - pose1.x) ** 2 + (wy - pose1.y) ** 2;
    const d2 = (wx - pose2.x) ** 2 + (wy - pose2.y) ** 2;
    if (d1 < d2) hi = mid2;
    else lo = mid1;
  }

  return (lo + hi) / 2;
}

export function SectionBoundaryMarkers({
  active,
  openDriveDocument,
  roadId,
  onBoundaryDragEnd,
  orbitControlsRef,
}: SectionBoundaryMarkersProps) {
  const { camera, gl } = useThree();

  const road = useMemo(() => {
    if (!active || !roadId) return null;
    return openDriveDocument.roads.find((r) => r.id === roadId) ?? null;
  }, [active, roadId, openDriveDocument]);

  const boundaries = useMemo(() => {
    if (!road || road.lanes.length <= 1) return [];
    const result: BoundaryData[] = [];
    for (let i = 1; i < road.lanes.length; i++) {
      const boundary = computeBoundary(road, i, road.lanes[i].s);
      if (boundary) result.push(boundary);
    }
    return result;
  }, [road]);

  // Refs for handle meshes (for manual raycasting)
  const handleMeshRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  const groupRef = useRef<THREE.Group>(null);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const dragSRef = useRef(0);
  const [dragGuide, setDragGuide] = useState<{
    points: [number, number, number][];
    center: [number, number, number];
  } | null>(null);

  const rectRef = useRef<DOMRect | null>(null);
  useEffect(() => {
    rectRef.current = gl.domElement.getBoundingClientRect();
    const handleResize = () => { rectRef.current = gl.domElement.getBoundingClientRect(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gl]);

  /** Raycast against handle spheres to find which one (if any) is under the pointer */
  const hitTestHandles = useCallback(
    (clientX: number, clientY: number): number | null => {
      const rect = rectRef.current;
      if (!rect || !groupRef.current) return null;

      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      const meshes = Array.from(handleMeshRefs.current.values());
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length === 0) return null;

      // Find which boundary index this mesh belongs to
      for (const [idx, mesh] of handleMeshRefs.current.entries()) {
        if (mesh === hits[0].object) return idx;
      }
      return null;
    },
    [camera],
  );

  /** Project pointer to road s-coordinate */
  const projectPointerToS = useCallback(
    (clientX: number, clientY: number, sectionIdx: number): number => {
      if (!road || road.planView.length === 0) return 0;

      const rect = rectRef.current;
      if (!rect) return 0;

      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersection = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(plane, intersection)) return 0;

      const s = projectToRoadS(road, intersection.x, intersection.y);
      return clampBoundaryS(road, sectionIdx, s);
    },
    [road, camera],
  );

  // DOM-level pointer events for drag interaction
  useEffect(() => {
    if (!active || !road || !roadId) return;

    const canvas = gl.domElement;
    let activeDragSectionIdx: number | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      const hitIdx = hitTestHandles(e.clientX, e.clientY);
      if (hitIdx === null) return;

      // Found a handle — start dragging
      e.stopImmediatePropagation(); // Prevent LaneEditInteraction from handling
      activeDragSectionIdx = boundaries[hitIdx]?.sectionIdx ?? null;
      if (activeDragSectionIdx === null) return;

      dragSRef.current = boundaries[hitIdx].s;
      setDragIdx(hitIdx);

      if (orbitControlsRef?.current) {
        orbitControlsRef.current.enabled = false;
      }
      canvas.style.cursor = 'ew-resize';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (activeDragSectionIdx !== null) {
        // Dragging a handle
        const newS = projectPointerToS(e.clientX, e.clientY, activeDragSectionIdx);
        dragSRef.current = newS;
        const guide = road ? computeBoundaryAtS(road, activeDragSectionIdx, newS) : null;
        setDragGuide(guide);
      } else {
        // Hover detection
        const hitIdx = hitTestHandles(e.clientX, e.clientY);
        setHoverIdx(hitIdx);
        canvas.style.cursor = hitIdx !== null ? 'ew-resize' : '';
      }
    };

    const handlePointerUp = () => {
      if (activeDragSectionIdx !== null) {
        const finalS = dragSRef.current;
        const sectionIdx = activeDragSectionIdx;
        activeDragSectionIdx = null;

        setDragIdx(null);
        setDragGuide(null);
        canvas.style.cursor = '';

        if (orbitControlsRef?.current) {
          orbitControlsRef.current.enabled = true;
        }

        const boundary = boundaries.find((b) => b.sectionIdx === sectionIdx);
        if (boundary && Math.abs(finalS - boundary.s) > 0.01) {
          onBoundaryDragEnd?.(roadId!, sectionIdx, finalS);
        }
      }
    };

    // Register with capture phase to intercept before LaneEditInteraction
    canvas.addEventListener('pointerdown', handlePointerDown, { capture: true });
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [active, road, roadId, boundaries, gl, hitTestHandles, projectPointerToS, orbitControlsRef, onBoundaryDragEnd]);

  if (!road || boundaries.length === 0) return null;

  return (
    <group ref={groupRef}>
      {boundaries.map((boundary, idx) => (
        <group key={`section-boundary-${boundary.sectionIdx}`}>
          {/* Dashed boundary line across road width */}
          <Line
            points={boundary.points}
            color="#ffaa00"
            lineWidth={1.5}
            dashed
            dashSize={0.5}
            gapSize={0.3}
          />

          {/* Drag handle sphere */}
          <mesh
            ref={(mesh) => {
              if (mesh) handleMeshRefs.current.set(idx, mesh);
              else handleMeshRefs.current.delete(idx);
            }}
            position={boundary.center}
          >
            <sphereGeometry args={[HANDLE_RADIUS, 16, 16]} />
            <meshStandardMaterial
              color={dragIdx === idx ? '#ffffff' : hoverIdx === idx ? '#ffcc44' : '#ffaa00'}
              emissive={dragIdx === idx ? '#ffffff' : hoverIdx === idx ? '#ffcc44' : '#ffaa00'}
              emissiveIntensity={dragIdx === idx ? 0.6 : hoverIdx === idx ? 0.5 : 0.3}
            />
          </mesh>
        </group>
      ))}

      {/* Drag guideline */}
      {dragIdx !== null && dragGuide && (
        <group>
          <Line
            points={dragGuide.points}
            color="#ffffff"
            lineWidth={2}
            dashed
            dashSize={0.3}
            gapSize={0.2}
          />
          <mesh position={dragGuide.center}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
