/**
 * Renders a junction surface fill mesh.
 * Uses polygonOffset to render behind connecting road meshes,
 * preventing z-fighting while filling gaps.
 *
 * Supports selection highlight and ghost preview modes.
 */

import React, { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { JunctionSurfaceData } from '@osce/opendrive';

const COLOR_DEFAULT = '#808080';
const COLOR_SELECTED = '#7c6fd4';
const COLOR_GHOST = '#8888cc';

interface JunctionMeshProps {
  surface: JunctionSurfaceData;
  selected?: boolean;
  ghost?: boolean;
  onClick?: (junctionId: string) => void;
  onContextMenu?: (junctionId: string, event: ThreeEvent<MouseEvent>) => void;
}

export const JunctionMesh: React.FC<JunctionMeshProps> = React.memo(
  ({ surface, selected = false, ghost = false, onClick, onContextMenu }) => {
    const geometry = useMemo(() => {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(surface.vertices, 3));
      geom.setIndex(new THREE.BufferAttribute(surface.indices, 1));
      geom.computeVertexNormals();
      return geom;
    }, [surface]);

    const handleClick = useCallback(
      (e: ThreeEvent<MouseEvent>) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick(surface.junctionId);
      },
      [onClick, surface.junctionId],
    );

    const handleContextMenu = useCallback(
      (e: ThreeEvent<MouseEvent>) => {
        if (!onContextMenu) return;
        e.stopPropagation();
        onContextMenu(surface.junctionId, e);
      },
      [onContextMenu, surface.junctionId],
    );

    const color = ghost ? COLOR_GHOST : selected ? COLOR_SELECTED : COLOR_DEFAULT;
    const opacity = ghost ? 0.3 : selected ? 0.9 : 1;

    return (
      <mesh geometry={geometry} onClick={handleClick} onContextMenu={handleContextMenu}>
        <meshStandardMaterial
          color={color}
          side={THREE.DoubleSide}
          roughness={0.8}
          transparent={ghost || selected}
          opacity={opacity}
          polygonOffset
          polygonOffsetFactor={4}
          polygonOffsetUnits={4}
        />
      </mesh>
    );
  },
);

JunctionMesh.displayName = 'JunctionMesh';
