/**
 * Renders a single lane as a Three.js mesh using BufferGeometry.
 * Converts LaneMeshData (Float32Array vertices + Uint32Array indices) to a Three.js mesh.
 *
 * Lane highlighting is handled centrally by LaneHighlightManager — this component
 * registers its mesh ref on mount and unregisters on unmount (no per-instance useFrame).
 */

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { LaneMeshData } from '@osce/shared';
import { getLaneColor } from '../utils/lane-type-colors.js';
import { registerLaneMesh, unregisterLaneMesh } from './LaneHighlightManager.js';

interface LaneMeshProps {
  laneMesh: LaneMeshData;
  /** Road ID this lane belongs to (for highlight matching) */
  roadId?: string;
}

export const LaneMesh: React.FC<LaneMeshProps> = React.memo(
  ({ laneMesh, roadId }) => {
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

    // Register mesh in the centralized highlight registry
    useEffect(() => {
      const mesh = meshRef.current;
      if (!mesh || !roadId) return;
      const key = `${roadId}:${laneMesh.laneId}`;
      registerLaneMesh(key, mesh, roadId, laneMesh.laneId);
      return () => unregisterLaneMesh(key);
    }, [roadId, laneMesh.laneId]);

    return (
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
    );
  },
);

LaneMesh.displayName = 'LaneMesh';
