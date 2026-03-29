/**
 * Renders a miscellaneous object (barrier, building, obstacle, etc.) as a box.
 */

import React from 'react';
import type { ScenarioEntity } from '@osce/shared';
import { getEntityGeometry, getEntityColor } from '../utils/entity-geometry.js';
import type { WorldCoords } from '../utils/position-resolver.js';
// import { ApexGlassMaterial } from '../materials/ApexGlassMaterial.js';
import { EntityLabel } from './EntityLabel.js';
import { HOVER_MATERIAL } from '../constants/selection-theme.js';
import { SelectionFeedback } from '../interaction/primitives/SelectionFeedback.js';

interface MiscObjectEntityProps {
  entity: ScenarioEntity;
  position: WorldCoords;
  isSelected: boolean;
  isHovered?: boolean;
  showLabel: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const MiscObjectEntity: React.FC<MiscObjectEntityProps> = React.memo(
  ({ entity, position, isSelected, isHovered, showLabel, onClick, onDoubleClick }) => {
    const geom = getEntityGeometry(entity);
    const color = getEntityColor('miscObject', false);

    return (
      <group
        position={[position.x, position.y, position.z]}
        rotation={[position.pitch ?? 0, position.roll ?? 0, position.h]}
      >
        {/* Object body */}
        <mesh
          position={[geom.centerX, geom.centerY, geom.centerZ]}
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(); }}
        >
          <boxGeometry args={[geom.length, geom.width, geom.height]} />
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

MiscObjectEntity.displayName = 'MiscObjectEntity';
