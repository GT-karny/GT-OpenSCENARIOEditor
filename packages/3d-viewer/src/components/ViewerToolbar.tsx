/**
 * Toolbar overlay for the 3D viewer.
 * Provides camera mode toggle, display toggles, and playback controls.
 */

import React from 'react';
import type { CameraMode } from '../store/viewer-types.js';
import type { SimulationPlaybackControls } from '../scenario/useSimulationPlayback.js';

interface ViewerToolbarProps {
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showRoadIds: boolean;
  onToggleRoadIds: () => void;
  showLaneIds: boolean;
  onToggleLaneIds: () => void;
  playbackControls?: SimulationPlaybackControls;
}

const toolbarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  display: 'flex',
  gap: '4px',
  flexWrap: 'wrap',
  zIndex: 10,
  pointerEvents: 'auto',
};

const buttonStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '11px',
  backgroundColor: 'rgba(40, 40, 60, 0.85)',
  color: '#ddd',
  border: '1px solid rgba(100, 100, 140, 0.5)',
  borderRadius: '4px',
  cursor: 'pointer',
  fontFamily: 'monospace',
};

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: 'rgba(60, 80, 160, 0.85)',
  color: '#fff',
  borderColor: 'rgba(100, 130, 220, 0.8)',
};

const playbackStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 8,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '4px',
  alignItems: 'center',
  zIndex: 10,
  pointerEvents: 'auto',
  backgroundColor: 'rgba(40, 40, 60, 0.85)',
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid rgba(100, 100, 140, 0.5)',
};

export const ViewerToolbar: React.FC<ViewerToolbarProps> = React.memo(
  ({
    cameraMode,
    onCameraModeChange,
    showGrid,
    onToggleGrid,
    showLabels,
    onToggleLabels,
    showRoadIds,
    onToggleRoadIds,
    showLaneIds,
    onToggleLaneIds,
    playbackControls,
  }) => {
    return (
      <>
        <div style={toolbarStyle}>
          <button
            style={cameraMode === 'orbit' ? activeButtonStyle : buttonStyle}
            onClick={() => onCameraModeChange('orbit')}
            title="Orbit camera mode"
          >
            3D
          </button>
          <button
            style={cameraMode === 'topDown' ? activeButtonStyle : buttonStyle}
            onClick={() => onCameraModeChange('topDown')}
            title="Top-down camera mode"
          >
            Top
          </button>
          <button
            style={showGrid ? activeButtonStyle : buttonStyle}
            onClick={onToggleGrid}
            title="Toggle grid"
          >
            Grid
          </button>
          <button
            style={showLabels ? activeButtonStyle : buttonStyle}
            onClick={onToggleLabels}
            title="Toggle entity labels"
          >
            Labels
          </button>
          <button
            style={showRoadIds ? activeButtonStyle : buttonStyle}
            onClick={onToggleRoadIds}
            title="Toggle road IDs"
          >
            RoadID
          </button>
          <button
            style={showLaneIds ? activeButtonStyle : buttonStyle}
            onClick={onToggleLaneIds}
            title="Toggle lane IDs"
          >
            LaneID
          </button>
        </div>

        {playbackControls && playbackControls.duration > 0 && (
          <div style={playbackStyle}>
            <button
              style={buttonStyle}
              onClick={
                playbackControls.status === 'playing'
                  ? playbackControls.pause
                  : playbackControls.play
              }
            >
              {playbackControls.status === 'playing' ? '||' : '|>'}
            </button>
            <button style={buttonStyle} onClick={playbackControls.stop}>
              Stop
            </button>
            <span style={{ color: '#aaa', fontSize: '11px', fontFamily: 'monospace' }}>
              {playbackControls.currentTime.toFixed(1)}s / {playbackControls.duration.toFixed(1)}s
            </span>
          </div>
        )}
      </>
    );
  },
);

ViewerToolbar.displayName = 'ViewerToolbar';
