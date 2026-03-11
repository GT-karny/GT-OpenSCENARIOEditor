/**
 * Merges all lane geometries for a road into a single BufferGeometry with vertex colors.
 * This reduces draw calls from N (one per lane) to 1 per road.
 *
 * Lane highlighting is supported by updating vertex colors for the highlighted
 * lane's vertices. The per-lane vertex ranges are registered in the
 * LaneHighlightManager for centralized update.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { LaneMeshData } from '@osce/shared';
import { getLaneColor } from '../utils/lane-type-colors.js';
import { registerMergedLaneMesh, unregisterMergedLaneMesh } from './LaneHighlightManager.js';

interface MergedLaneMeshProps {
  roadId: string;
  lanes: LaneMeshData[];
}

interface LaneVertexRange {
  laneId: number;
  startVertex: number;
  vertexCount: number;
  baseColor: THREE.Color;
}

const _color = new THREE.Color();

export const MergedLaneMesh: React.FC<MergedLaneMeshProps> = React.memo(
  ({ roadId, lanes }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    const { geometry, laneRanges } = useMemo(() => {
      // Calculate totals
      let totalVertices = 0;
      let totalIndices = 0;
      for (const lane of lanes) {
        totalVertices += lane.vertices.length / 3;
        totalIndices += lane.indices.length;
      }

      const positions = new Float32Array(totalVertices * 3);
      const colors = new Float32Array(totalVertices * 3);
      const indices = new Uint32Array(totalIndices);
      const ranges: LaneVertexRange[] = [];

      let vertexOffset = 0;
      let indexOffset = 0;

      for (const lane of lanes) {
        const numVerts = lane.vertices.length / 3;
        _color.set(getLaneColor(lane.laneType));

        // Copy positions
        positions.set(lane.vertices, vertexOffset * 3);

        // Set vertex colors
        for (let i = 0; i < numVerts; i++) {
          const ci = (vertexOffset + i) * 3;
          colors[ci] = _color.r;
          colors[ci + 1] = _color.g;
          colors[ci + 2] = _color.b;
        }

        // Copy and offset indices
        for (let i = 0; i < lane.indices.length; i++) {
          indices[indexOffset + i] = lane.indices[i] + vertexOffset;
        }

        ranges.push({
          laneId: lane.laneId,
          startVertex: vertexOffset,
          vertexCount: numVerts,
          baseColor: _color.clone(),
        });

        vertexOffset += numVerts;
        indexOffset += lane.indices.length;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geom.setIndex(new THREE.BufferAttribute(indices, 1));
      geom.computeVertexNormals();

      return { geometry: geom, laneRanges: ranges };
    }, [lanes]);

    // Register in highlight manager
    useEffect(() => {
      const mesh = meshRef.current;
      if (!mesh) return;
      registerMergedLaneMesh(roadId, mesh, laneRanges);
      return () => unregisterMergedLaneMesh(roadId);
    }, [roadId, laneRanges]);

    if (lanes.length === 0) return null;

    return (
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
    );
  },
);

MergedLaneMesh.displayName = 'MergedLaneMesh';
