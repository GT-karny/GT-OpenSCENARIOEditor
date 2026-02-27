/**
 * Orchestrates rendering of all scenario entities.
 * Dispatches to the appropriate entity renderer based on entity type.
 */

import React from 'react';
import type { ScenarioEntity } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import { VehicleEntity } from './VehicleEntity.js';
import { PedestrianEntity } from './PedestrianEntity.js';
import { MiscObjectEntity } from './MiscObjectEntity.js';

interface EntityGroupProps {
  entities: ScenarioEntity[];
  entityPositions: Map<string, WorldCoords>;
  selectedEntityId: string | null;
  onEntitySelect: (entityId: string) => void;
  onEntityFocus?: (entityId: string) => void;
  showLabels: boolean;
}

function isEgoEntity(entity: ScenarioEntity, index: number): boolean {
  const name = entity.name.toLowerCase();
  return index === 0 || name === 'ego' || name.startsWith('ego');
}

export const EntityGroup: React.FC<EntityGroupProps> = React.memo(
  ({ entities, entityPositions, selectedEntityId, onEntitySelect, onEntityFocus, showLabels }) => {
    return (
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {entities.map((entity, idx) => {
          const position = entityPositions.get(entity.name);
          if (!position) return null;

          const isSelected = entity.id === selectedEntityId;
          const isEgo = isEgoEntity(entity, idx);

          const commonProps = {
            entity,
            position,
            isSelected,
            showLabel: showLabels,
            onClick: () => onEntitySelect(entity.id),
            onDoubleClick: () => onEntityFocus?.(entity.id),
          };

          switch (entity.type) {
            case 'vehicle':
              return (
                <VehicleEntity
                  key={entity.id}
                  {...commonProps}
                  isEgo={isEgo}
                />
              );
            case 'pedestrian':
              return (
                <PedestrianEntity
                  key={entity.id}
                  {...commonProps}
                />
              );
            case 'miscObject':
              return (
                <MiscObjectEntity
                  key={entity.id}
                  {...commonProps}
                />
              );
            default:
              return null;
          }
        })}
      </group>
    );
  },
);

EntityGroup.displayName = 'EntityGroup';
