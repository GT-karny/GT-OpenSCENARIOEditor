/**
 * Visual preview for taper range selection.
 * Shows a marker line at the taper start position,
 * and a highlight band on the target side between start and current hover position.
 * Uses imperative Three.js updates via useFrame.
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OdrRoad } from '@osce/shared';
import { evaluateReferenceLineAtS } from '@osce/opendrive';

export interface TaperPreviewRef {
  road: OdrRoad | null;
  startS: number;
  currentS: number;
  phase: 'idle' | 'start-picked' | 'end-picked' | 'lane-extend';
  visible: boolean;
  side: 'left' | 'right';
}

interface TaperRangePreviewProps {
  dataRef: React.RefObject<TaperPreviewRef>;
}

/** Compute the cross-line points for only the target side of the road */
function updateSideLine(
  line: THREE.Line,
  road: OdrRoad,
  s: number,
  z: number,
  side: 'left' | 'right',
): void {
  if (road.planView.length === 0) { line.visible = false; return; }

  const pose = evaluateReferenceLineAtS(road.planView, s);
  const perpX = -Math.sin(pose.hdg);
  const perpY = Math.cos(pose.hdg);

  let sectionIdx = 0;
  for (let i = road.lanes.length - 1; i >= 0; i--) {
    if (s >= road.lanes[i].s) { sectionIdx = i; break; }
  }
  const section = road.lanes[sectionIdx];
  const lw = section ? Math.max(section.leftLanes.length * 3.5, 1.0) + 0.5 : 4;
  const rw = section ? Math.max(section.rightLanes.length * 3.5, 1.0) + 0.5 : 4;

  const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;

  if (side === 'left') {
    // Center line to left edge
    posAttr.setXYZ(0, pose.x, pose.y, z);
    posAttr.setXYZ(1, pose.x + perpX * lw, pose.y + perpY * lw, z);
  } else {
    // Center line to right edge
    posAttr.setXYZ(0, pose.x, pose.y, z);
    posAttr.setXYZ(1, pose.x - perpX * rw, pose.y - perpY * rw, z);
  }

  posAttr.needsUpdate = true;
  line.geometry.computeBoundingSphere();
  line.computeLineDistances();
  line.visible = true;
}

function createLineObj(color: number, dashed: boolean): THREE.Line {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const material = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.4, gapSize: 0.2 })
    : new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(geometry, material);
  line.visible = false;
  return line;
}

export function TaperRangePreview({ dataRef }: TaperRangePreviewProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startLineRef = useRef<THREE.Line | null>(null);
  const hoverLineRef = useRef<THREE.Line | null>(null);
  const bandMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const startLine = createLineObj(0x44ff88, false); // green solid
    const hoverLine = createLineObj(0xffdd44, true);  // yellow dashed
    const bandGeo = new THREE.BufferGeometry();
    const bandMat = new THREE.MeshBasicMaterial({
      color: 0x9b84e8,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    bandMesh.visible = false;

    startLineRef.current = startLine;
    hoverLineRef.current = hoverLine;
    bandMeshRef.current = bandMesh;

    if (groupRef.current) {
      groupRef.current.add(startLine, hoverLine, bandMesh);
    }

    return () => {
      startLine.geometry.dispose();
      (startLine.material as THREE.Material).dispose();
      hoverLine.geometry.dispose();
      (hoverLine.material as THREE.Material).dispose();
      bandGeo.dispose();
      bandMat.dispose();
      if (groupRef.current) {
        groupRef.current.remove(startLine, hoverLine, bandMesh);
      }
    };
  }, []);

  useFrame(() => {
    const data = dataRef.current;
    const startLine = startLineRef.current;
    const hoverLine = hoverLineRef.current;
    const bandMesh = bandMeshRef.current;
    if (!startLine || !hoverLine || !bandMesh) return;

    const showStart = data && data.visible && data.road && data.phase === 'start-picked';

    if (!showStart || !data?.road) {
      startLine.visible = false;
      hoverLine.visible = false;
      bandMesh.visible = false;
      return;
    }

    const road = data.road;
    const side = data.side;

    // Start marker line (green) — only on target side
    updateSideLine(startLine, road, data.startS, 0.09, side);

    // Hover end line (yellow dashed) — only on target side
    updateSideLine(hoverLine, road, data.currentS, 0.09, side);

    // Band between start and hover — only on target side
    const s1 = Math.min(data.startS, data.currentS);
    const s2 = Math.max(data.startS, data.currentS);
    if (s2 - s1 < 0.5) {
      bandMesh.visible = false;
      return;
    }

    const steps = Math.max(2, Math.ceil((s2 - s1) / 2));
    const vertices: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const s = s1 + (s2 - s1) * (i / steps);
      const pose = evaluateReferenceLineAtS(road.planView, s);
      const perpX = -Math.sin(pose.hdg);
      const perpY = Math.cos(pose.hdg);

      let secIdx = 0;
      for (let j = road.lanes.length - 1; j >= 0; j--) {
        if (s >= road.lanes[j].s) { secIdx = j; break; }
      }
      const sec = road.lanes[secIdx];

      if (side === 'left') {
        const lw = sec ? Math.max(sec.leftLanes.length * 3.5, 1.0) : 3.5;
        // Center to left edge
        vertices.push(
          pose.x, pose.y, 0.06,
          pose.x + perpX * lw, pose.y + perpY * lw, 0.06,
        );
      } else {
        const rw = sec ? Math.max(sec.rightLanes.length * 3.5, 1.0) : 3.5;
        // Center to right edge
        vertices.push(
          pose.x, pose.y, 0.06,
          pose.x - perpX * rw, pose.y - perpY * rw, 0.06,
        );
      }
    }

    const indices: number[] = [];
    for (let i = 0; i < steps; i++) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }

    const bandGeo = bandMesh.geometry;
    bandGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    bandGeo.setIndex(indices);
    bandGeo.attributes.position.needsUpdate = true;
    bandGeo.computeBoundingSphere();
    bandMesh.visible = true;
  });

  return <group ref={groupRef} />;
}
