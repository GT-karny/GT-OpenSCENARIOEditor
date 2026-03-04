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
  const flySpeed = useViewerStore(viewerStore, (s) => s.flySpeed);

  const entities = useScenarioEntities(scenarioStore);
  const entityPositions = useEntityPositions(scenarioStore, openDriveDocument);

  const isSimulating = currentFrame != null;

  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);
  const cameraRef = useRef<CameraControllerHandle>(null);

  // Camera follow (only active during simulation)
  useCameraFollow({
    targetEntity: followTargetEntity,
    orbitControlsRef: cameraRef.current?.orbitControls ?? { current: null },
    entityPositions,
    currentFrame,
    isSimulating,
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
      <CameraController ref={cameraRef} mode={cameraMode} focusTarget={focusTarget} flySpeed={flySpeed} />

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

/** Speed slider styles */
const speedSliderStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  backgroundColor: 'rgba(40, 40, 60, 0.85)',
  border: '1px solid rgba(100, 100, 140, 0.5)',
  borderRadius: '4px',
  zIndex: 10,
  pointerEvents: 'auto',
  fontFamily: 'monospace',
  fontSize: '11px',
  color: '#ddd',
};

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

  // Reactive state subscriptions for toolbar and speed slider
  const cameraMode = useViewerStore(viewerStore, (s) => s.cameraMode);
  const showGrid = useViewerStore(viewerStore, (s) => s.showGrid);
  const showEntityLabels = useViewerStore(viewerStore, (s) => s.showEntityLabels);
  const showRoadIds = useViewerStore(viewerStore, (s) => s.showRoadIds);
  const showLaneIds = useViewerStore(viewerStore, (s) => s.showLaneIds);
  const gizmoMode = useViewerStore(viewerStore, (s) => s.gizmoMode);
  const reverseDirection = useViewerStore(viewerStore, (s) => s.reverseDirection);
  const followTargetEntity = useViewerStore(viewerStore, (s) => s.followTargetEntity);
  const flySpeed = useViewerStore(viewerStore, (s) => s.flySpeed);

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      <ViewerToolbar
        cameraMode={cameraMode}
        onCameraModeChange={(m) => viewerStore.getState().setCameraMode(m)}
        showGrid={showGrid}
        onToggleGrid={() => viewerStore.getState().toggleGrid()}
        showLabels={showEntityLabels}
        onToggleLabels={() => viewerStore.getState().toggleEntityLabels()}
        showRoadIds={showRoadIds}
        onToggleRoadIds={() => viewerStore.getState().toggleRoadIds()}
        showLaneIds={showLaneIds}
        onToggleLaneIds={() => viewerStore.getState().toggleLaneIds()}
        gizmoMode={gizmoMode}
        onGizmoModeChange={(m) => viewerStore.getState().setGizmoMode(m)}
        reverseDirection={reverseDirection}
        onToggleReverseDirection={() => viewerStore.getState().toggleReverseDirection()}
        followTargetEntity={followTargetEntity}
        onFollowTargetChange={(name) => viewerStore.getState().setFollowTarget(name)}
        entities={entities}
      />

      {/* Speed multiplier slider (top-right) */}
      <div style={speedSliderStyle}>
        <span>Speed</span>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={flySpeed}
          onChange={(e) => viewerStore.getState().setFlySpeed(Number(e.target.value))}
          style={{ width: 80, cursor: 'pointer' }}
        />
        <span style={{ minWidth: 30, textAlign: 'right' }}>{flySpeed.toFixed(1)}x</span>
      </div>

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
