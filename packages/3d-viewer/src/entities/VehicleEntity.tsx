/**
 * Renders a vehicle as a 3D box with a direction arrow cone.
 * Uses BoundingBox dimensions from the entity definition.
 */

import React, { useRef } from 'react';
import type * as THREE from 'three';
import type { ScenarioEntity } from '@osce/shared';
import { getEntityGeometry, getEntityColor } from '../utils/entity-geometry.js';
import type { WorldCoords } from '../utils/position-resolver.js';
// import { ApexGlassMaterial } from '../materials/ApexGlassMaterial.js';
import { ApexEdgeGlow } from '../materials/ApexEdgeGlow.js';
import { EntityLabel } from './EntityLabel.js';

interface VehicleEntityProps {
  entity: ScenarioEntity;
  position: WorldCoords;
  isSelected: boolean;
  isHovered?: boolean;
  isEgo: boolean;
  showLabel: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const VehicleEntity: React.FC<VehicleEntityProps> = React.memo(
  ({ entity, position, isSelected, isHovered, isEgo, showLabel, onClick, onDoubleClick }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const geom = getEntityGeometry(entity);
    const color = getEntityColor('vehicle', isEgo);

    return (
      <group
        position={[position.x, position.y, position.z]}
        rotation={[position.pitch ?? 0, position.roll ?? 0, position.h]}
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
            color={isHovered ? '#66BBFF' : color}
            transparent={isSelected || !!isHovered}
            opacity={isSelected ? 0.9 : isHovered ? 0.8 : 1}
            emissive={isHovered ? '#55CCFF' : '#000000'}
            emissiveIntensity={isHovered ? 1.2 : 0}
          />
          <ApexEdgeGlow
            overrideColor={isSelected ? '#FFFF00' : isHovered ? '#44DDFF' : undefined}
            overrideThickness={isSelected ? 0.08 : isHovered ? 0.15 : undefined}
          />
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
        {(showLabel || isHovered) && (
          <EntityLabel
            name={entity.name}
            position={[geom.centerX, 0, geom.centerZ + geom.height / 2 + 0.5]}
            isSelected={isSelected}
            isHovered={isHovered}
          />
        )}
      </group>
    );
  },
);

VehicleEntity.displayName = 'VehicleEntity';
