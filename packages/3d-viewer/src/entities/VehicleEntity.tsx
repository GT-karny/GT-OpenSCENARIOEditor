/**
 * Renders a vehicle as a 3D box with a direction arrow cone.
 * Uses BoundingBox dimensions from the entity definition.
 */

import React, { useRef } from 'react';
import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import type { ScenarioEntity } from '@osce/shared';
import { getEntityGeometry, getEntityColor } from '../utils/entity-geometry.js';
import type { WorldCoords } from '../utils/position-resolver.js';
import { EntityLabel } from './EntityLabel.js';

interface VehicleEntityProps {
  entity: ScenarioEntity;
  position: WorldCoords;
  isSelected: boolean;
  isEgo: boolean;
  showLabel: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const VehicleEntity: React.FC<VehicleEntityProps> = React.memo(
  ({ entity, position, isSelected, isEgo, showLabel, onClick, onDoubleClick }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const geom = getEntityGeometry(entity);
    const color = getEntityColor('vehicle', isEgo);

    return (
      <group
        position={[position.x, position.y, position.z]}
        rotation={[0, 0, position.h]}
      >
        {/* Vehicle body */}
        <mesh
          ref={meshRef}
          position={[geom.centerX, geom.centerY, geom.centerZ]}
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(); }}
        >
          <boxGeometry args={[geom.length, geom.width, geom.height]} />
          <meshStandardMaterial
            color={color}
            transparent={isSelected}
            opacity={isSelected ? 0.9 : 1}
          />
          {isSelected && (
            <Outlines thickness={0.08} color="#FFFF00" />
          )}
        </mesh>

        {/* Direction arrow (cone at front of vehicle) */}
        <mesh
          position={[geom.centerX + geom.length / 2 + 0.3, 0, geom.centerZ]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <coneGeometry args={[0.3, 0.6, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* Entity label */}
        {showLabel && (
          <EntityLabel
            name={entity.name}
            position={[geom.centerX, 0, geom.centerZ + geom.height / 2 + 0.5]}
            isSelected={isSelected}
          />
        )}
      </group>
    );
  },
);

VehicleEntity.displayName = 'VehicleEntity';
