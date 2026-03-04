/**
 * Orchestrates rendering of all scenario entities.
 * Dispatches to the appropriate entity renderer based on entity type.
 * When a gizmo mode is active, attaches a TransformControls gizmo to the selected entity.
 */

import React, { useRef, useCallback } from 'react';
import type * as THREE from 'three';
import type { ScenarioEntity } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { GizmoMode } from '../store/viewer-types.js';
import { VehicleEntity } from './VehicleEntity.js';
import { PedestrianEntity } from './PedestrianEntity.js';
import { MiscObjectEntity } from './MiscObjectEntity.js';
import { EntityGizmo } from '../interaction/EntityGizmo.js';

interface EntityGroupProps {
  entities: ScenarioEntity[];
  entityPositions: Map<string, WorldCoords>;
  selectedEntityId: string | null;
  onEntitySelect: (entityId: string) => void;
  onEntityFocus?: (entityId: string) => void;
  showLabels: boolean;
  gizmoMode?: GizmoMode;
  orbitControlsRef?: React.RefObject<any>;
  onEntityPositionChange?: (entityName: string, x: number, y: number, z: number, h: number) => void;
}

function isEgoEntity(entity: ScenarioEntity, index: number): boolean {
  const name = entity.name.toLowerCase();
  return index === 0 || name === 'ego' || name.startsWith('ego');
}

/**
 * Wrapper that provides a ref for attaching the gizmo.
 */
function EntityWithRef({
  entity,
  position,
  isSelected,
  isEgo,
  showLabel,
  onSelect,
  onFocus,
  groupRef,
}: {
  entity: ScenarioEntity;
  position: WorldCoords;
  isSelected: boolean;
  isEgo: boolean;
  showLabel: boolean;
  onSelect: () => void;
  onFocus?: () => void;
  groupRef?: React.Ref<THREE.Group>;
}) {
  const commonProps = {
    entity,
    position,
    isSelected,
    showLabel,
    onClick: onSelect,
    onDoubleClick: onFocus,
  };

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[0, 0, position.h]}
    >
      {/* Reset position/rotation for the child since the group handles it */}
      {entity.type === 'vehicle' && (
        <VehicleEntity
          key={entity.id}
          {...commonProps}
          position={{ x: 0, y: 0, z: 0, h: 0 }}
          isEgo={isEgo}
        />
      )}
      {entity.type === 'pedestrian' && (
        <PedestrianEntity
          key={entity.id}
          {...commonProps}
          position={{ x: 0, y: 0, z: 0, h: 0 }}
        />
      )}
      {entity.type === 'miscObject' && (
        <MiscObjectEntity
          key={entity.id}
          {...commonProps}
          position={{ x: 0, y: 0, z: 0, h: 0 }}
        />
      )}
    </group>
  );
}

export const EntityGroup: React.FC<EntityGroupProps> = React.memo(
  ({
    entities,
    entityPositions,
    selectedEntityId,
    onEntitySelect,
    onEntityFocus,
    showLabels,
    gizmoMode = 'off',
    orbitControlsRef,
    onEntityPositionChange,
  }) => {
    const selectedGroupRef = useRef<THREE.Group>(null);

    const selectedEntity = entities.find((e) => e.id === selectedEntityId);

    const handleGizmoDragEnd = useCallback(
      (x: number, y: number, z: number, h: number) => {
        if (!selectedEntity || !onEntityPositionChange) return;
        onEntityPositionChange(selectedEntity.name, x, y, z, h);
      },
      [selectedEntity, onEntityPositionChange],
    );

    return (
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {entities.map((entity, idx) => {
          const position = entityPositions.get(entity.name);
          if (!position) return null;

          const isSelected = entity.id === selectedEntityId;
          const isEgo = isEgoEntity(entity, idx);

          if (isSelected && gizmoMode !== 'off') {
            // Selected entity with gizmo — use ref wrapper
            return (
              <EntityWithRef
                key={entity.id}
                entity={entity}
                position={position}
                isSelected={isSelected}
                isEgo={isEgo}
                showLabel={showLabels}
                onSelect={() => onEntitySelect(entity.id)}
                onFocus={() => onEntityFocus?.(entity.id)}
                groupRef={selectedGroupRef}
              />
            );
          }

          // Non-selected entity — render directly (original path)
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

        {/* Gizmo for selected entity */}
        {gizmoMode !== 'off' && selectedGroupRef.current && (
          <EntityGizmo
            object={selectedGroupRef}
            mode={gizmoMode}
            orbitControlsRef={orbitControlsRef}
            onDragEnd={handleGizmoDragEnd}
          />
        )}
      </group>
    );
  },
);

EntityGroup.displayName = 'EntityGroup';
