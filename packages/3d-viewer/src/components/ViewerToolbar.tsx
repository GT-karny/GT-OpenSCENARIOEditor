/**
 * Toolbar overlay for the 3D viewer.
 * Provides camera mode toggle, display toggles, gizmo mode, follow target, and reverse direction.
 */

import React, { useState, useCallback } from 'react';
import type { ScenarioEntity } from '@osce/shared';
import type { CameraMode, GizmoMode } from '../store/viewer-types.js';

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
  gizmoMode: GizmoMode;
  onGizmoModeChange: (mode: GizmoMode) => void;
  reverseDirection: boolean;
  onToggleReverseDirection: () => void;
  followTargetEntity: string | null;
  onFollowTargetChange: (entityName: string | null) => void;
  entities: ScenarioEntity[];
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
  alignItems: 'flex-start',
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

const separatorStyle: React.CSSProperties = {
  width: '1px',
  height: '24px',
  backgroundColor: 'rgba(100, 100, 140, 0.4)',
  alignSelf: 'center',
  margin: '0 2px',
};

const dropdownContainerStyle: React.CSSProperties = {
  position: 'relative',
};

const dropdownMenuStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: '4px',
  backgroundColor: 'rgba(30, 30, 50, 0.95)',
  border: '1px solid rgba(100, 100, 140, 0.5)',
  borderRadius: '4px',
  padding: '2px',
  minWidth: '120px',
  zIndex: 20,
};

const dropdownItemStyle: React.CSSProperties = {
  ...buttonStyle,
  display: 'block',
  width: '100%',
  textAlign: 'left',
  border: 'none',
  borderRadius: '2px',
  backgroundColor: 'transparent',
};

const dropdownItemActiveStyle: React.CSSProperties = {
  ...dropdownItemStyle,
  backgroundColor: 'rgba(60, 80, 160, 0.6)',
  color: '#fff',
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
    gizmoMode,
    onGizmoModeChange,
    reverseDirection,
    onToggleReverseDirection,
    followTargetEntity,
    onFollowTargetChange,
    entities,
  }) => {
    const [followDropdownOpen, setFollowDropdownOpen] = useState(false);

    const handleFollowSelect = useCallback(
      (entityName: string | null) => {
        onFollowTargetChange(entityName);
        setFollowDropdownOpen(false);
      },
      [onFollowTargetChange],
    );

    return (
      <div style={toolbarStyle}>
        {/* Camera mode */}
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

        <div style={separatorStyle} />

        {/* Gizmo mode */}
        <button
          style={gizmoMode === 'translate' ? activeButtonStyle : buttonStyle}
          onClick={() => onGizmoModeChange(gizmoMode === 'translate' ? 'off' : 'translate')}
          title="Move entity (translate gizmo)"
        >
          Move
        </button>
        <button
          style={gizmoMode === 'rotate' ? activeButtonStyle : buttonStyle}
          onClick={() => onGizmoModeChange(gizmoMode === 'rotate' ? 'off' : 'rotate')}
          title="Rotate entity heading"
        >
          Rot
        </button>
        <button
          style={reverseDirection ? activeButtonStyle : buttonStyle}
          onClick={onToggleReverseDirection}
          title="Reverse driving direction when snapping to lane"
        >
          Rev
        </button>

        <div style={separatorStyle} />

        {/* Follow camera */}
        <div style={dropdownContainerStyle}>
          <button
            style={followTargetEntity ? activeButtonStyle : buttonStyle}
            onClick={() => setFollowDropdownOpen(!followDropdownOpen)}
            title="Follow entity with camera"
          >
            Follow{followTargetEntity ? `: ${followTargetEntity}` : ''}
          </button>

          {followDropdownOpen && (
            <div style={dropdownMenuStyle}>
              <button
                style={!followTargetEntity ? dropdownItemActiveStyle : dropdownItemStyle}
                onClick={() => handleFollowSelect(null)}
              >
                OFF
              </button>
              {entities.map((entity) => (
                <button
                  key={entity.id}
                  style={followTargetEntity === entity.name ? dropdownItemActiveStyle : dropdownItemStyle}
                  onClick={() => handleFollowSelect(entity.name)}
                >
                  {entity.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={separatorStyle} />

        {/* Display toggles */}
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
    );
  },
);

ViewerToolbar.displayName = 'ViewerToolbar';
