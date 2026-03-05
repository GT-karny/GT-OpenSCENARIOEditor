/**
 * Orchestrates rendering of all scenario entities.
 * Dispatches to the appropriate entity renderer based on entity type.
 * When a gizmo mode is active, attaches a TransformControls gizmo to the selected entity.
 * For road-coordinate translate mode, uses RoadGizmo instead of TransformControls.
 */

import React, { useRef, useState, useCallback } from 'react';
import type * as THREE from 'three';
import type { ScenarioEntity, OpenDriveDocument } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { GizmoMode } from '../store/viewer-types.js';
import { VehicleEntity } from './VehicleEntity.js';
import { PedestrianEntity } from './PedestrianEntity.js';
import { MiscObjectEntity } from './MiscObjectEntity.js';
import { EntityGizmo } from '../interaction/EntityGizmo.js';
import { RoadGizmo } from '../interaction/RoadGizmo.js';

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
  /** OpenDRIVE document for road-coordinate gizmo projection */
  openDriveDocument?: OpenDriveDocument | null;
  /** Whether to snap gizmo movement to lane centers */
  snapToLane?: boolean;
  /** Current road position of the selected entity (for road-coordinate gizmo) */
  selectedEntityRoadPosition?: { roadId: string; laneId: number; s: number } | null;
}

function isEgoEntity(entity: ScenarioEntity, index: number): boolean {
  const name = entity.name.toLowerCase();
  return index === 0 || name === 'ego' || name.startsWith('ego');
}

/**
 * Wrapper that provides a ref for attaching the gizmo.
 * Optionally renders RoadGizmo as a child (inside the rotation group).
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
  roadGizmoProps,
}: {
  entity: ScenarioEntity;
  position: WorldCoords;
  isSelected: boolean;
  isEgo: boolean;
  showLabel: boolean;
  onSelect: () => void;
  onFocus?: () => void;
  groupRef?: React.Ref<THREE.Group>;
  roadGizmoProps?: {
    entityRef: React.RefObject<THREE.Group | null>;
    openDriveDocument: OpenDriveDocument;
    currentRoadPosition: { roadId: string; laneId: number; s: number };
    orbitControlsRef?: React.RefObject<any>;
    onDragEnd?: (worldX: number, worldY: number, worldZ: number, heading: number) => void;
  };
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
      {/* RoadGizmo rendered INSIDE the entity group so arrows inherit position + heading */}
      {roadGizmoProps && (
        <RoadGizmo
          entityRef={roadGizmoProps.entityRef}
          openDriveDocument={roadGizmoProps.openDriveDocument}
          currentRoadPosition={roadGizmoProps.currentRoadPosition}
          orbitControlsRef={roadGizmoProps.orbitControlsRef}
          onDragEnd={roadGizmoProps.onDragEnd}
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
    openDriveDocument,
    snapToLane,
    selectedEntityRoadPosition,
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

    // Determine if road-coordinate gizmo should be used
    const useRoadGizmo =
      gizmoMode === 'translate' &&
      !!openDriveDocument &&
      !!snapToLane &&
      !!selectedEntityRoadPosition;

    // Use standard EntityGizmo for rotate mode or when road gizmo is not applicable
    const useEntityGizmo =
      (gizmoMode === 'translate' || gizmoMode === 'rotate') && !useRoadGizmo;

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
                  roadGizmoProps={
                    useRoadGizmo
                      ? {
                          entityRef: selectedGroupRef,
                          openDriveDocument: openDriveDocument!,
                          currentRoadPosition: selectedEntityRoadPosition!,
                          orbitControlsRef,
                          onDragEnd: handleGizmoDragEnd,
                        }
                      : undefined
                  }
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

        {/* Standard gizmo rendered OUTSIDE the rotation group (for rotate mode or non-road entities) */}
        {useEntityGizmo && selectedGroup && (
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
