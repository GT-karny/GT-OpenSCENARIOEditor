/**
 * Orchestrates rendering of all scenario entities.
 * Dispatches to the appropriate entity renderer based on entity type.
 * When a gizmo mode is active, attaches a TransformControls gizmo to the selected entity.
 */

import React, { useRef, useState, useCallback } from 'react';
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

  // Outer group: position + heading only (gizmo attaches here)
  // Inner group: road surface tilt (pitch/roll) — visual only, not gizmo-affected
  const zeroed = { x: 0, y: 0, z: 0, h: 0 } as WorldCoords;

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[0, 0, position.h]}
    >
      <group rotation={[position.pitch ?? 0, position.roll ?? 0, 0]}>
        {entity.type === 'vehicle' && (
          <VehicleEntity
            key={entity.id}
            {...commonProps}
            position={zeroed}
            isEgo={isEgo}
          />
        )}
        {entity.type === 'pedestrian' && (
          <PedestrianEntity
            key={entity.id}
            {...commonProps}
            position={zeroed}
          />
        )}
        {entity.type === 'miscObject' && (
          <MiscObjectEntity
            key={entity.id}
            {...commonProps}
            position={zeroed}
          />
        )}
      </group>
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
    const [selectedGroup, setSelectedGroup] = useState<THREE.Group | null>(null);

    const selectedGroupCallbackRef = useCallback((node: THREE.Group | null) => {
      selectedGroupRef.current = node;
      setSelectedGroup(node);
    }, []);

    const selectedEntity = entities.find((e) => e.id === selectedEntityId);

    const handleGizmoDragEnd = useCallback(
      (x: number, y: number, z: number, h: number) => {
        if (!selectedEntity || !onEntityPositionChange) return;
        onEntityPositionChange(selectedEntity.name, x, y, z, h);
      },
      [selectedEntity, onEntityPositionChange],
    );

    return (
      <>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          {entities.map((entity, idx) => {
            const position = entityPositions.get(entity.name);
            if (!position) return null;

            const isSelected = entity.id === selectedEntityId;
            const isEgo = isEgoEntity(entity, idx);

            if (isSelected && (gizmoMode === 'translate' || gizmoMode === 'rotate')) {
              // Selected entity with gizmo — use callback ref wrapper
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
                  groupRef={selectedGroupCallbackRef}
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
        </group>

        {/* Gizmo rendered OUTSIDE the rotation group to avoid double-transform */}
        {(gizmoMode === 'translate' || gizmoMode === 'rotate') && selectedGroup && (
          <EntityGizmo
            object={selectedGroupRef}
            mode={gizmoMode as 'translate' | 'rotate'}
            orbitControlsRef={orbitControlsRef}
            onDragEnd={handleGizmoDragEnd}
          />
        )}
      </>
    );
  },
);

EntityGroup.displayName = 'EntityGroup';
