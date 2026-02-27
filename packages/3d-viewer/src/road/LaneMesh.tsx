/**
 * Renders a single lane as a Three.js mesh using BufferGeometry.
 * Converts LaneMeshData (Float32Array vertices + Uint32Array indices) to a Three.js mesh.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { LaneMeshData } from '@osce/shared';
import { getLaneColor } from '../utils/lane-type-colors.js';

interface LaneMeshProps {
  laneMesh: LaneMeshData;
}

export const LaneMesh: React.FC<LaneMeshProps> = React.memo(({ laneMesh }) => {
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

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
    </mesh>
  );
});

LaneMesh.displayName = 'LaneMesh';
