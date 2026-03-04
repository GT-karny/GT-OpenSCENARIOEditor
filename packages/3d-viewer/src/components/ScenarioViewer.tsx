/**
 * Main public component: 3D scenario viewer.
 * Wires together road rendering, entity display, camera controls,
 * scenario store subscription, and simulation playback.
 */

import React, { useState, useCallback, useRef } from 'react';
import type { OpenDriveDocument, SimulationFrame, EditorPreferences } from '@osce/shared';
import { createViewerStore, useViewerStore } from '../store/viewer-store.js';
import { ViewerCanvas } from '../scene/ViewerCanvas.js';
import { SceneEnvironment } from '../scene/SceneEnvironment.js';
import { CameraController } from '../scene/CameraController.js';
import type { CameraControllerHandle } from '../scene/CameraController.js';
import { RoadNetwork } from '../road/RoadNetwork.js';
import { EntityGroup } from '../entities/EntityGroup.js';
import { ViewerToolbar } from './ViewerToolbar.js';
import { useScenarioEntities } from '../scenario/useScenarioEntities.js';
import { useEntityPositions } from '../scenario/useEntityPositions.js';
import { SimulationOverlay } from '../scenario/SimulationOverlay.js';
import { useCameraFollow } from '../scene/useCameraFollow.js';

export interface ScenarioViewerProps {
  /** The scenario engine Zustand store (vanilla) */
  scenarioStore: ReturnType<typeof import('@osce/scenario-engine').createScenarioStore>;
  /** Parsed OpenDRIVE document for road rendering */
  openDriveDocument: OpenDriveDocument | null;
  /** Currently selected entity ID (controlled externally) */
  selectedEntityId?: string | null;
  /** Callback when user clicks an entity in the viewer */
  onEntitySelect?: (entityId: string) => void;
  /** Callback when user double-clicks an entity (request focus) */
  onEntityFocus?: (entityId: string) => void;
  /** Callback when entity position is changed via gizmo drag */
  onEntityPositionChange?: (entityName: string, x: number, y: number, z: number, h: number) => void;
  /** Current simulation frame to display (null = show init positions) */
  currentFrame?: SimulationFrame | null;
  /** Editor preferences for display toggles */
  preferences?: Partial<EditorPreferences>;
  /** CSS class for the container */
  className?: string;
  /** CSS style for the container */
  style?: React.CSSProperties;
}

/**
 * Inner component that lives inside the R3F Canvas.
 */
function ScenarioViewerScene({
  scenarioStore,
  openDriveDocument,
  selectedEntityId,
  onEntitySelect,
  onEntityFocus,
  onEntityPositionChange,
  currentFrame,
  viewerStore,
}: {
  scenarioStore: ScenarioViewerProps['scenarioStore'];
  openDriveDocument: OpenDriveDocument | null;
  selectedEntityId: string | null;
  onEntitySelect: (entityId: string) => void;
  onEntityFocus: (entityId: string) => void;
  onEntityPositionChange?: (entityName: string, x: number, y: number, z: number, h: number) => void;
  currentFrame?: SimulationFrame | null;
  viewerStore: ReturnType<typeof createViewerStore>;
}) {
  const cameraMode = useViewerStore(viewerStore, (s) => s.cameraMode);
  const showGrid = useViewerStore(viewerStore, (s) => s.showGrid);
  const showLaneIds = useViewerStore(viewerStore, (s) => s.showLaneIds);
  const showRoadIds = useViewerStore(viewerStore, (s) => s.showRoadIds);
  const showEntityLabels = useViewerStore(viewerStore, (s) => s.showEntityLabels);
  const gizmoMode = useViewerStore(viewerStore, (s) => s.gizmoMode);
  const followTargetEntity = useViewerStore(viewerStore, (s) => s.followTargetEntity);
  const followMode = useViewerStore(viewerStore, (s) => s.followMode);

  const entities = useScenarioEntities(scenarioStore);
  const entityPositions = useEntityPositions(scenarioStore, openDriveDocument);

  const isSimulating = currentFrame != null;

  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);
  const cameraRef = useRef<CameraControllerHandle>(null);

  // Camera follow
  useCameraFollow({
    targetEntity: followTargetEntity,
    followMode,
    orbitControlsRef: cameraRef.current?.orbitControls ?? { current: null },
    entityPositions,
    currentFrame,
  });

  const handleEntityFocus = useCallback(
    (entityId: string) => {
      onEntityFocus(entityId);
      // Find entity position and set as camera focus target
      const entity = entities.find((e) => e.id === entityId);
      if (entity) {
        const pos = entityPositions.get(entity.name);
        if (pos) {
          // Convert to Three.js coords (after the rotation group transform)
          setFocusTarget([pos.x, pos.z, -pos.y]);
        }
      }
    },
    [entities, entityPositions, onEntityFocus],
  );

  return (
    <>
      <SceneEnvironment showGrid={showGrid} />
      <CameraController ref={cameraRef} mode={cameraMode} focusTarget={focusTarget} />

      <RoadNetwork
        odrDocument={openDriveDocument}
        showRoadMarks
        showRoadIds={showRoadIds}
        showLaneIds={showLaneIds}
      />

      {/* Show init positions when not simulating */}
      {!isSimulating && (
        <EntityGroup
          entities={entities}
          entityPositions={entityPositions}
          selectedEntityId={selectedEntityId}
          onEntitySelect={onEntitySelect}
          onEntityFocus={handleEntityFocus}
          showLabels={showEntityLabels}
          gizmoMode={gizmoMode}
          orbitControlsRef={cameraRef.current?.orbitControls}
          onEntityPositionChange={onEntityPositionChange}
        />
      )}

      {/* Show simulation positions during playback */}
      {isSimulating && (
        <SimulationOverlay
          entities={entities}
          currentFrame={currentFrame!}
          selectedEntityId={selectedEntityId}
          onEntitySelect={onEntitySelect}
          showLabels={showEntityLabels}
        />
      )}
    </>
  );
}

/**
 * Main exported 3D viewer component.
 * Renders the complete scenario visualization with road network and entities.
 */
export const ScenarioViewer: React.FC<ScenarioViewerProps> = ({
  scenarioStore,
  openDriveDocument,
  selectedEntityId = null,
  onEntitySelect,
  onEntityFocus,
  onEntityPositionChange,
  currentFrame: currentFrameProp,
  preferences,
  className,
  style,
}) => {
  const viewerStoreRef = useRef<ReturnType<typeof createViewerStore> | null>(null);
  if (!viewerStoreRef.current) {
    viewerStoreRef.current = createViewerStore(preferences);
  }
  const viewerStore = viewerStoreRef.current;

  const handleEntitySelect = useCallback(
    (entityId: string) => onEntitySelect?.(entityId),
    [onEntitySelect],
  );

  const handleEntityFocus = useCallback(
    (entityId: string) => onEntityFocus?.(entityId),
    [onEntityFocus],
  );

  const entities = useScenarioEntities(scenarioStore);
  const vs = viewerStore.getState();

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      <ViewerToolbar
        cameraMode={vs.cameraMode}
        onCameraModeChange={(m) => viewerStore.getState().setCameraMode(m)}
        showGrid={vs.showGrid}
        onToggleGrid={() => viewerStore.getState().toggleGrid()}
        showLabels={vs.showEntityLabels}
        onToggleLabels={() => viewerStore.getState().toggleEntityLabels()}
        showRoadIds={vs.showRoadIds}
        onToggleRoadIds={() => viewerStore.getState().toggleRoadIds()}
        showLaneIds={vs.showLaneIds}
        onToggleLaneIds={() => viewerStore.getState().toggleLaneIds()}
        gizmoMode={vs.gizmoMode}
        onGizmoModeChange={(m) => viewerStore.getState().setGizmoMode(m)}
        reverseDirection={vs.reverseDirection}
        onToggleReverseDirection={() => viewerStore.getState().toggleReverseDirection()}
        followTargetEntity={vs.followTargetEntity}
        onFollowTargetChange={(name) => viewerStore.getState().setFollowTarget(name)}
        followMode={vs.followMode}
        onFollowModeChange={(m) => viewerStore.getState().setFollowMode(m)}
        entities={entities}
      />

      <ViewerCanvas>
        <ScenarioViewerScene
          scenarioStore={scenarioStore}
          openDriveDocument={openDriveDocument}
          selectedEntityId={selectedEntityId ?? null}
          onEntitySelect={handleEntitySelect}
          onEntityFocus={handleEntityFocus}
          onEntityPositionChange={onEntityPositionChange}
          currentFrame={currentFrameProp}
          viewerStore={viewerStore}
        />
      </ViewerCanvas>
    </div>
  );
};

ScenarioViewer.displayName = 'ScenarioViewer';
