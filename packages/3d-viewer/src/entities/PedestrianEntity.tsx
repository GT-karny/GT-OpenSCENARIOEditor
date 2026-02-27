/**
 * Renders a pedestrian as a cylinder with an optional label.
 */

import React from 'react';
import { Outlines } from '@react-three/drei';
import type { ScenarioEntity } from '@osce/shared';
import { getEntityGeometry, getEntityColor } from '../utils/entity-geometry.js';
import type { WorldCoords } from '../utils/position-resolver.js';
import { EntityLabel } from './EntityLabel.js';

interface PedestrianEntityProps {
  entity: ScenarioEntity;
  position: WorldCoords;
  isSelected: boolean;
  showLabel: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const PedestrianEntity: React.FC<PedestrianEntityProps> = React.memo(
  ({ entity, position, isSelected, showLabel, onClick, onDoubleClick }) => {
    const geom = getEntityGeometry(entity);
    const color = getEntityColor('pedestrian', false);
    const radius = Math.max(geom.width, geom.length) / 2;

    return (
      <group
        position={[position.x, position.y, position.z]}
        rotation={[0, 0, position.h]}
      >
        {/* Pedestrian body (cylinder) */}
        <mesh
          position={[geom.centerX, geom.centerY, geom.centerZ]}
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(); }}
        >
          <cylinderGeometry args={[radius, radius, geom.height, 12]} />
          <meshStandardMaterial color={color} />
          {isSelected && (
            <Outlines thickness={0.06} color="#FFFF00" />
          )}
        </mesh>

        {/* Label */}
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

PedestrianEntity.displayName = 'PedestrianEntity';
