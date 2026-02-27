/**
 * Renders entity positions from simulation frames during playback.
 * Overrides the init positions when simulation data is available.
 */

import React, { useMemo } from 'react';
import type { ScenarioEntity, SimulationFrame } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import { VehicleEntity } from '../entities/VehicleEntity.js';
import { PedestrianEntity } from '../entities/PedestrianEntity.js';
import { MiscObjectEntity } from '../entities/MiscObjectEntity.js';

interface SimulationOverlayProps {
  entities: ScenarioEntity[];
  currentFrame: SimulationFrame | null;
  selectedEntityId: string | null;
  onEntitySelect: (entityId: string) => void;
  showLabels: boolean;
}

export const SimulationOverlay: React.FC<SimulationOverlayProps> = React.memo(
  ({ entities, currentFrame, selectedEntityId, onEntitySelect, showLabels }) => {
    // Map simulation object states to entity positions
    const simPositions = useMemo(() => {
      if (!currentFrame) return new Map<string, WorldCoords>();
      const map = new Map<string, WorldCoords>();
      for (const obj of currentFrame.objects) {
        map.set(obj.name, {
          x: obj.x,
          y: obj.y,
          z: obj.z,
          h: obj.h,
        });
      }
      return map;
    }, [currentFrame]);

    if (!currentFrame || simPositions.size === 0) return null;

    return (
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {entities.map((entity, idx) => {
          const position = simPositions.get(entity.name);
          if (!position) return null;

          const isSelected = entity.id === selectedEntityId;
          const isEgo = idx === 0 || entity.name.toLowerCase().startsWith('ego');

          const commonProps = {
            entity,
            position,
            isSelected,
            showLabel: showLabels,
            onClick: () => onEntitySelect(entity.id),
          };

          switch (entity.type) {
            case 'vehicle':
              return <VehicleEntity key={entity.id} {...commonProps} isEgo={isEgo} />;
            case 'pedestrian':
              return <PedestrianEntity key={entity.id} {...commonProps} />;
            case 'miscObject':
              return <MiscObjectEntity key={entity.id} {...commonProps} />;
            default:
              return null;
          }
        })}
      </group>
    );
  },
);

SimulationOverlay.displayName = 'SimulationOverlay';
