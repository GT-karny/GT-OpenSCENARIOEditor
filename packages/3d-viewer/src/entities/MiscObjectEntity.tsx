/**
 * Renders a miscellaneous object (barrier, building, obstacle, etc.) as a box.
 */

import React from 'react';
import { Outlines } from '@react-three/drei';
import type { ScenarioEntity } from '@osce/shared';
import { getEntityGeometry, getEntityColor } from '../utils/entity-geometry.js';
import type { WorldCoords } from '../utils/position-resolver.js';
import { EntityLabel } from './EntityLabel.js';

interface MiscObjectEntityProps {
  entity: ScenarioEntity;
  position: WorldCoords;
  isSelected: boolean;
  showLabel: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const MiscObjectEntity: React.FC<MiscObjectEntityProps> = React.memo(
  ({ entity, position, isSelected, showLabel, onClick, onDoubleClick }) => {
    const geom = getEntityGeometry(entity);
    const color = getEntityColor('miscObject', false);

    return (
      <group
        position={[position.x, position.y, position.z]}
        rotation={[0, 0, position.h]}
      >
        {/* Object body */}
        <mesh
          position={[geom.centerX, geom.centerY, geom.centerZ]}
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(); }}
        >
          <boxGeometry args={[geom.length, geom.width, geom.height]} />
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

MiscObjectEntity.displayName = 'MiscObjectEntity';
