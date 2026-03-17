/**
 * Preview line for lane section split.
 * Uses imperative Three.js updates via useFrame for smooth tracking.
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OdrRoad } from '@osce/shared';
import { evaluateReferenceLineAtS } from '@osce/opendrive';

export interface SplitPreviewRef {
  road: OdrRoad | null;
  s: number;
  visible: boolean;
}

interface SplitPreviewLineProps {
  dataRef: React.RefObject<SplitPreviewRef>;
}

function computeCrossPoints(
  road: OdrRoad,
  s: number,
): [THREE.Vector3, THREE.Vector3] | null {
  if (road.planView.length === 0) return null;

  const pose = evaluateReferenceLineAtS(road.planView, s);
  const perpX = -Math.sin(pose.hdg);
  const perpY = Math.cos(pose.hdg);

  let sectionIdx = 0;
  for (let i = road.lanes.length - 1; i >= 0; i--) {
    if (s >= road.lanes[i].s) { sectionIdx = i; break; }
  }
  const section = road.lanes[sectionIdx];
  if (!section) return null;

  const leftWidth = Math.max(section.leftLanes.length * 3.5, 1.0) + 1.0;
  const rightWidth = Math.max(section.rightLanes.length * 3.5, 1.0) + 1.0;

  return [
    new THREE.Vector3(pose.x - perpX * rightWidth, pose.y - perpY * rightWidth, 0.08),
    new THREE.Vector3(pose.x + perpX * leftWidth, pose.y + perpY * leftWidth, 0.08),
  ];
}

export function SplitPreviewLine({ dataRef }: SplitPreviewLineProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lineObjRef = useRef<THREE.Line | null>(null);

  // Create the line object once
  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineDashedMaterial({
      color: 0xff4444,
      dashSize: 0.4,
      gapSize: 0.2,
      transparent: true,
      opacity: 0.9,
    });

    const line = new THREE.Line(geometry, material);
    line.visible = false;
    line.computeLineDistances();
    lineObjRef.current = line;

    if (groupRef.current) {
      groupRef.current.add(line);
    }

    return () => {
      geometry.dispose();
      material.dispose();
      if (groupRef.current) {
        groupRef.current.remove(line);
      }
    };
  }, []);

  useFrame(() => {
    const line = lineObjRef.current;
    const data = dataRef.current;
    if (!line) return;

    if (!data || !data.visible || !data.road) {
      line.visible = false;
      return;
    }

    const pts = computeCrossPoints(data.road, data.s);
    if (!pts) {
      line.visible = false;
      return;
    }

    const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.setXYZ(0, pts[0].x, pts[0].y, pts[0].z);
    posAttr.setXYZ(1, pts[1].x, pts[1].y, pts[1].z);
    posAttr.needsUpdate = true;
    line.geometry.computeBoundingSphere();
    line.computeLineDistances();
    line.visible = true;
  });

  return <group ref={groupRef} />;
}
