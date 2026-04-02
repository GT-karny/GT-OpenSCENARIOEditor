/**
 * Renders entity positions from simulation frames during playback.
 * Overrides the init positions when simulation data is available.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import type { ScenarioEntity, SimulationFrame } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { VehicleLightState } from './useEntityLightStates.js';
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

    // Extract vehicle light states from simulation frame
    const simLightStates = useMemo(() => {
      if (!currentFrame?.vehicleLightStates) return new Map<string, VehicleLightState>();
      const map = new Map<string, VehicleLightState>();
      for (const vl of currentFrame.vehicleLightStates) {
        const indicatorLeft =
          vl.indicator === 'left' || vl.indicator === 'warning' ? 'flashing' as const : null;
        const indicatorRight =
          vl.indicator === 'right' || vl.indicator === 'warning' ? 'flashing' as const : null;
        const headLight = vl.headLight;
        const highBeam = vl.highBeam;
        const brakeLight = vl.brakeLight;
        if (indicatorLeft || indicatorRight || headLight || highBeam || brakeLight) {
          map.set(vl.name, { indicatorLeft, indicatorRight, headLight, highBeam, brakeLight });
        }
      }
      return map;
    }, [currentFrame?.vehicleLightStates]);

    // Diagnostic: log name mismatches on first frame, then position changes periodically
    const renderCountRef = useRef(0);
    const hasLoggedRef = useRef(false);
    renderCountRef.current++;

    useEffect(() => {
      if (!currentFrame) return;

      if (!hasLoggedRef.current) {
        hasLoggedRef.current = true;
        const simNames = currentFrame.objects.map((o) => o.name);
        const entityNames = entities.map((e) => e.name);
        const unmatched = entityNames.filter((name) => !simNames.includes(name));
        const unmatchedSim = simNames.filter((name) => !entityNames.includes(name));

        if (unmatched.length > 0 || unmatchedSim.length > 0) {
          console.warn(
            `[SimulationOverlay] Entity name mismatch!\n` +
              `  Entities not in sim: [${unmatched.map((n) => JSON.stringify(n)).join(', ')}]\n` +
              `  Sim objects not in entities: [${unmatchedSim.map((n) => JSON.stringify(n)).join(', ')}]`,
          );
        } else {
          console.warn(
            `[SimulationOverlay] All ${entityNames.length} entities matched simulation objects.`,
          );
        }
      }

      // Log positions every 30 renders to verify they change
      if (renderCountRef.current <= 3 || renderCountRef.current % 30 === 0) {
        const posStr = currentFrame.objects
          .map((o) => `${o.name}(x=${o.x.toFixed(2)},y=${o.y.toFixed(2)},z=${o.z.toFixed(2)},h=${o.h.toFixed(2)})`)
          .join(' | ');
        console.warn(
          `[SimulationOverlay] render #${renderCountRef.current}, t=${currentFrame.time.toFixed(2)}: ${posStr}`,
        );
      }
    }, [currentFrame, entities]);

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
              return <VehicleEntity key={entity.id} {...commonProps} isEgo={isEgo} lightState={simLightStates.get(entity.name)} />;
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
