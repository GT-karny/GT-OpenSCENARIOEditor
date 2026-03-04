/**
 * Renders a single lane as a Three.js mesh using BufferGeometry.
 * Converts LaneMeshData (Float32Array vertices + Uint32Array indices) to a Three.js mesh.
 * Supports imperative lane highlighting via ref (no React re-renders).
 */

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { LaneMeshData } from '@osce/shared';
import { getLaneColor } from '../utils/lane-type-colors.js';

interface LaneMeshProps {
  laneMesh: LaneMeshData;
  /** Road ID this lane belongs to (for highlight matching) */
  roadId?: string;
  /** Ref-based lane highlight — checked imperatively each frame */
  highlightedLaneRef?: React.RefObject<{ roadId: string; laneId: number } | null>;
}

export const LaneMesh: React.FC<LaneMeshProps> = React.memo(
  ({ laneMesh, roadId, highlightedLaneRef }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    const geometry = useMemo(() => {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(laneMesh.vertices, 3));
      geom.setIndex(new THREE.BufferAttribute(laneMesh.indices, 1));
      if (laneMesh.uvs) {
        geom.setAttribute('uv', new THREE.BufferAttribute(laneMesh.uvs, 2));
      }
      geom.computeVertexNormals();
      return geom;
    }, [laneMesh]);

    const color = useMemo(() => getLaneColor(laneMesh.laneType), [laneMesh.laneType]);

    // Imperatively update emissive for lane highlight (no React re-renders)
    useFrame(() => {
      if (!meshRef.current || !highlightedLaneRef) return;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const hl = highlightedLaneRef.current;
      const isMatch = hl != null && hl.roadId === roadId && hl.laneId === laneMesh.laneId;
      if (isMatch) {
        mat.emissive.set('#3388CC');
        mat.emissiveIntensity = 0.4;
      } else if (mat.emissiveIntensity !== 0) {
        mat.emissive.set('#000000');
        mat.emissiveIntensity = 0;
      }
    });

    return (
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
    );
  },
);

LaneMesh.displayName = 'LaneMesh';
