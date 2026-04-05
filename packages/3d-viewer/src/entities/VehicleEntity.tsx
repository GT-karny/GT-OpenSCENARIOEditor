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
import { EntityLabel } from './EntityLabel.js';
import { HOVER_MATERIAL } from '../constants/selection-theme.js';
import { SelectionFeedback } from '../interaction/primitives/SelectionFeedback.js';
import type { VehicleLightState } from '../scenario/useEntityLightStates.js';
import { VehicleLightEffects } from './VehicleLightEffects.js';

interface VehicleEntityProps {
  entity: ScenarioEntity;
  position: WorldCoords;
  isSelected: boolean;
  isHovered?: boolean;
  isEgo: boolean;
  showLabel: boolean;
  lightState?: VehicleLightState;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const VehicleEntity: React.FC<VehicleEntityProps> = React.memo(
  ({ entity, position, isSelected, isHovered, isEgo, showLabel, lightState, onClick, onDoubleClick }) => {
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
            color={isHovered ? HOVER_MATERIAL.color : color}
            transparent={isSelected || !!isHovered}
            opacity={isSelected ? 0.9 : isHovered ? HOVER_MATERIAL.opacity : 1}
            emissive={isHovered ? HOVER_MATERIAL.emissive : '#000000'}
            emissiveIntensity={isHovered ? HOVER_MATERIAL.emissiveIntensity : 0}
          />
          <SelectionFeedback state={isSelected ? 'selected' : isHovered ? 'hovered' : null} />
        </mesh>

        {/* Direction arrow (cone at front of vehicle) */}
        <mesh
          position={[geom.centerX + geom.length / 2 + 0.3, 0, geom.centerZ]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <coneGeometry args={[0.3, 0.6, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* Vehicle light effects (indicators, headlights, brake lights) */}
        {lightState && (
          <VehicleLightEffects
            vehicleWidth={geom.width}
            vehicleLength={geom.length}
            centerX={geom.centerX}
            centerZ={geom.centerZ}
            lightState={lightState}
          />
        )}

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
