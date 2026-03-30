/**
 * Renders a pedestrian as a cylinder with an optional label.
 */

import React from 'react';
import type { ScenarioEntity } from '@osce/shared';
import { getEntityGeometry, getEntityColor } from '../utils/entity-geometry.js';
import type { WorldCoords } from '../utils/position-resolver.js';
// import { ApexGlassMaterial } from '../materials/ApexGlassMaterial.js';
import { EntityLabel } from './EntityLabel.js';
import { HOVER_MATERIAL } from '../constants/selection-theme.js';
import { SelectionFeedback } from '../interaction/primitives/SelectionFeedback.js';

interface PedestrianEntityProps {
  entity: ScenarioEntity;
  position: WorldCoords;
  isSelected: boolean;
  isHovered?: boolean;
  showLabel: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const PedestrianEntity: React.FC<PedestrianEntityProps> = React.memo(
  ({ entity, position, isSelected, isHovered, showLabel, onClick, onDoubleClick }) => {
    const geom = getEntityGeometry(entity);
    const color = getEntityColor('pedestrian', false);
    const radius = Math.max(geom.width, geom.length) / 2;

    return (
      <group
        position={[position.x, position.y, position.z]}
        rotation={[position.pitch ?? 0, position.roll ?? 0, position.h]}
      >
        {/* Pedestrian body (cylinder) */}
        <mesh
          position={[geom.centerX, geom.centerY, geom.centerZ]}
          rotation={[Math.PI / 2, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(); }}
        >
          <cylinderGeometry args={[radius, radius, geom.height, 12]} />
          <meshStandardMaterial
            color={isHovered ? HOVER_MATERIAL.color : color}
            transparent={!!isHovered}
            opacity={isHovered ? HOVER_MATERIAL.opacity : 1}
            emissive={isHovered ? HOVER_MATERIAL.emissive : '#000000'}
            emissiveIntensity={isHovered ? HOVER_MATERIAL.emissiveIntensity : 0}
          />
          <SelectionFeedback state={isSelected ? 'selected' : isHovered ? 'hovered' : null} size="small" />
        </mesh>

        {/* Label */}
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

PedestrianEntity.displayName = 'PedestrianEntity';
