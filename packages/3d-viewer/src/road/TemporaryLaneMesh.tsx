/**
 * Overlay mesh for the temporary (roadworks) lane layer (OpenDRIVE 1.9).
 *
 * Same merged-geometry approach as MergedLaneMesh, but the per-lane vertex
 * colors are blended toward an orange "works" tint and the whole mesh is drawn
 * translucent, lifted +0.05 m in the OpenDRIVE z (local up, before RoadNetwork's
 * z-up → y-up rotation) to avoid z-fighting with the permanent surface below.
 */

import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { RoadMeshData } from '@osce/shared';
import { getLaneColor } from '../utils/lane-type-colors.js';

interface TemporaryLaneMeshProps {
  meshData: RoadMeshData;
}

/** Lift above the permanent surface (OpenDRIVE z, local up). */
const TEMPORARY_Z_OFFSET = 0.05;

/** Works tint blended over each lane's base color. */
const TEMPORARY_TINT = new THREE.Color('#ff9500');
/** How far to pull each lane color toward the tint (0 = original, 1 = tint). */
const TINT_BLEND = 0.5;

const _color = new THREE.Color();

export const TemporaryLaneMesh: React.FC<TemporaryLaneMeshProps> = React.memo(
  ({ meshData }) => {
    const geometry = useMemo(() => {
      const lanes = meshData.laneSections.flatMap((section) => section.lanes);

      let totalVertices = 0;
      let totalIndices = 0;
      for (const lane of lanes) {
        totalVertices += lane.vertices.length / 3;
        totalIndices += lane.indices.length;
      }

      const positions = new Float32Array(totalVertices * 3);
      const colors = new Float32Array(totalVertices * 3);
      const indices = new Uint32Array(totalIndices);

      let vertexOffset = 0;
      let indexOffset = 0;

      for (const lane of lanes) {
        const numVerts = lane.vertices.length / 3;
        _color.set(getLaneColor(lane.laneType)).lerp(TEMPORARY_TINT, TINT_BLEND);

        positions.set(lane.vertices, vertexOffset * 3);

        for (let i = 0; i < numVerts; i++) {
          const ci = (vertexOffset + i) * 3;
          colors[ci] = _color.r;
          colors[ci + 1] = _color.g;
          colors[ci + 2] = _color.b;
        }

        for (let i = 0; i < lane.indices.length; i++) {
          indices[indexOffset + i] = lane.indices[i] + vertexOffset;
        }

        vertexOffset += numVerts;
        indexOffset += lane.indices.length;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geom.setIndex(new THREE.BufferAttribute(indices, 1));
      geom.computeVertexNormals();

      return geom;
    }, [meshData]);

    // Dispose the previous geometry when a new one is created, and on unmount.
    useEffect(() => {
      return () => geometry.dispose();
    }, [geometry]);

    if (geometry.getAttribute('position').count === 0) return null;

    return (
      <mesh geometry={geometry} position={[0, 0, TEMPORARY_Z_OFFSET]} renderOrder={2}>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.8}
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </mesh>
    );
  },
);

TemporaryLaneMesh.displayName = 'TemporaryLaneMesh';
