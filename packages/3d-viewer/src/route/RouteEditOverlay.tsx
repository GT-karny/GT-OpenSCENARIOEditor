/**
 * HTML overlay shown during route editing mode.
 * Displays mode label, waypoint count, warnings, and action buttons.
 * Rendered outside the R3F Canvas, positioned over the 3D viewer.
 */

import React from 'react';

interface RouteEditOverlayProps {
  waypointCount: number;
  warnings: string[];
  onSave: () => void;
  onCancel: () => void;
  /** Lane-change-aware routing (GT_esmini). When undefined, the toggle is hidden. */
  laneChangeAware?: boolean;
  /** Whether the lane-change-aware toggle is usable (WASM router ready). */
  laneChangeAvailable?: boolean;
  onToggleLaneChangeAware?: (on: boolean) => void;
  /** Routing strategy: 0 = SHORTEST, 1 = FASTEST, 2 = MIN_INTERSECTIONS. */
  strategy?: number;
  onStrategyChange?: (strategy: number) => void;
}

const STRATEGY_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'Shortest' },
  { value: 1, label: 'Fastest' },
  { value: 2, label: 'Min intersections' },
];

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 16px',
  backgroundColor: 'rgba(20, 20, 40, 0.92)',
  border: '1px solid rgba(100, 140, 220, 0.5)',
  borderRadius: '8px',
  zIndex: 20,
  pointerEvents: 'auto',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '12px',
  color: '#ddd',
  backdropFilter: 'blur(8px)',
  whiteSpace: 'nowrap',
};

const labelStyle: React.CSSProperties = {
  color: '#6cb4ff',
  fontWeight: 600,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const countStyle: React.CSSProperties = {
  color: '#ccc',
  fontSize: '11px',
};

const warningStyle: React.CSSProperties = {
  color: '#f0c040',
  fontSize: '11px',
};

const buttonBase: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 500,
  transition: 'opacity 0.15s',
};

const saveButtonStyle: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: 'rgba(60, 140, 255, 0.85)',
  color: '#fff',
};

const cancelButtonStyle: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: 'rgba(100, 100, 120, 0.6)',
  color: '#ccc',
};

const toggleLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '11px',
  color: '#ddd',
  cursor: 'pointer',
  userSelect: 'none',
};

const selectStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#ddd',
  backgroundColor: 'rgba(40, 40, 64, 0.9)',
  border: '1px solid rgba(100, 140, 220, 0.5)',
  borderRadius: '4px',
  padding: '2px 4px',
  cursor: 'pointer',
};

const dividerStyle: React.CSSProperties = { color: 'rgba(100,140,220,0.4)' };

export const RouteEditOverlay: React.FC<RouteEditOverlayProps> = React.memo(
  ({
    waypointCount,
    warnings,
    onSave,
    onCancel,
    laneChangeAware,
    laneChangeAvailable = true,
    onToggleLaneChangeAware,
    strategy = 0,
    onStrategyChange,
  }) => {
    const showLaneChange = !!onToggleLaneChangeAware;
    return (
      <div style={overlayStyle}>
        <span style={labelStyle}>Route Edit</span>
        <span style={dividerStyle}>|</span>
        <span style={countStyle}>
          {waypointCount} waypoint{waypointCount !== 1 ? 's' : ''}
        </span>

        {showLaneChange && (
          <>
            <span style={dividerStyle}>|</span>
            <label
              style={{
                ...toggleLabelStyle,
                opacity: laneChangeAvailable ? 1 : 0.45,
                cursor: laneChangeAvailable ? 'pointer' : 'not-allowed',
              }}
              title={
                laneChangeAvailable
                  ? 'Compute routes that may change lanes mid-road (GT_esmini)'
                  : 'Loading road network…'
              }
            >
              <input
                type="checkbox"
                checked={!!laneChangeAware}
                disabled={!laneChangeAvailable}
                onChange={(e) => onToggleLaneChangeAware?.(e.target.checked)}
              />
              Lane-change aware
            </label>
            {laneChangeAware && (
              <select
                style={selectStyle}
                value={strategy}
                onChange={(e) => onStrategyChange?.(Number(e.target.value))}
                title="Routing strategy"
              >
                {STRATEGY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        {warnings.length > 0 && (
          <>
            <span style={dividerStyle}>|</span>
            <span style={warningStyle}>{warnings[0]}</span>
          </>
        )}

        <span style={dividerStyle}>|</span>

        <button type="button" style={saveButtonStyle} onClick={onSave}>
          Done
        </button>
        <button type="button" style={cancelButtonStyle} onClick={onCancel}>
          Cancel
        </button>

        <span style={{ color: '#888', fontSize: '10px' }}>(Esc to cancel)</span>
      </div>
    );
  },
);

RouteEditOverlay.displayName = 'RouteEditOverlay';
