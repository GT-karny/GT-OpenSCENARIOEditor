import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ScenarioViewer } from '@osce/3d-viewer';
import type {
  ViewerMode,
  RouteEditConfig,
  TrajectoryEditConfig,
  SignalSelectionConfig,
  PositionPickConfig,
} from '@osce/3d-viewer';
import { useSimulationStore } from '../../stores/simulation-store';
import type { useScenarioStoreApi } from '../../stores/use-scenario-store';

interface SimulationViewerBridgeProps {
  scenarioStore: ReturnType<typeof useScenarioStoreApi>;
  openDriveDocument: import('@osce/shared').OpenDriveDocument | null;
  selectedEntityId: string | null;
  hoveredEntityName: string | null;
  onEntitySelect: (entityId: string) => void;
  onEntityFocus: (entityId: string) => void;
  onEntityPositionChange?: (
    entityName: string,
    x: number,
    y: number,
    z: number,
    h: number,
    forceWorldPosition?: boolean,
  ) => void;
  onViewerModeChange?: (mode: ViewerMode) => void;
  preferences: {
    showGrid3D: boolean;
    showLaneIds: boolean;
    showRoadIds: boolean;
    showDrivingDirection: boolean;
  };
  focusEntityId?: string | null;
  routeEdit?: RouteEditConfig;
  trajectoryEdit?: TrajectoryEditConfig;
  signalSelection?: SignalSelectionConfig;
  positionPick?: PositionPickConfig;
}

/**
 * Thin wrapper that computes the current display frame from the simulation store,
 * so only the 3D viewer re-renders on frame changes (not the entire EditorLayout).
 */
export const SimulationViewerBridge = memo(function SimulationViewerBridge(
  props: SimulationViewerBridgeProps,
) {
  const simStatus = useSimulationStore((s) => s.status);
  const simFrames = useSimulationStore(useShallow((s) => s.frames));
  const currentFrameIndex = useSimulationStore((s) => s.currentFrameIndex);

  // Compute display frame based on simulation state:
  // - running: show the latest frame (live streaming)
  // - completed/error: show frame at currentFrameIndex (replay scrubbing)
  // - idle: no frame
  let currentFrame = null;
  if (simStatus === 'running' && simFrames.length > 0) {
    currentFrame = simFrames[simFrames.length - 1];
  } else if ((simStatus === 'completed' || simStatus === 'error') && simFrames.length > 0) {
    currentFrame = simFrames[currentFrameIndex] ?? simFrames[simFrames.length - 1];
  }

  return (
    <ScenarioViewer
      scenarioStore={props.scenarioStore}
      openDriveDocument={props.openDriveDocument}
      selectedEntityId={props.selectedEntityId}
      hoveredEntityName={props.hoveredEntityName}
      onEntitySelect={props.onEntitySelect}
      onEntityFocus={props.onEntityFocus}
      onEntityPositionChange={props.onEntityPositionChange}
      onViewerModeChange={props.onViewerModeChange}
      currentFrame={currentFrame}
      simulationStatus={simStatus}
      preferences={props.preferences}
      focusEntityId={props.focusEntityId}
      routeEdit={props.routeEdit}
      trajectoryEdit={props.trajectoryEdit}
      signalSelection={props.signalSelection}
      positionPick={props.positionPick}
      showPerf={false}
      className="h-full w-full"
    />
  );
});
