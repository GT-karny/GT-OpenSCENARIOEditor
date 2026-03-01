/**
 * Renders a junction surface fill mesh.
 * Uses polygonOffset to render behind connecting road meshes,
 * preventing z-fighting while filling gaps.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { JunctionSurfaceData } from '@osce/opendrive';

interface JunctionMeshProps {
  surface: JunctionSurfaceData;
}

export const JunctionMesh: React.FC<JunctionMeshProps> = React.memo(({ surface }) => {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(surface.vertices, 3));
    geom.setIndex(new THREE.BufferAttribute(surface.indices, 1));
    geom.computeVertexNormals();
    return geom;
  }, [surface]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#808080"
        side={THREE.DoubleSide}
        roughness={0.8}
        polygonOffset
        polygonOffsetFactor={4}
        polygonOffsetUnits={4}
      />
    </mesh>
  );
});

JunctionMesh.displayName = 'JunctionMesh';
