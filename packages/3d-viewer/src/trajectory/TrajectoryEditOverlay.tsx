/**
 * HTML overlay shown during trajectory editing mode.
 * Displays mode label, shape type, point count, warnings, and action buttons.
 * Orange/amber theme to distinguish from route editing.
 */

import React from 'react';

interface TrajectoryEditOverlayProps {
  shapeType: 'polyline' | 'clothoid' | 'nurbs';
  pointCount: number;
  warnings: string[];
  onSave: () => void;
  onCancel: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 16px',
  backgroundColor: 'rgba(40, 25, 10, 0.92)',
  border: '1px solid rgba(220, 150, 60, 0.5)',
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
  color: '#FF9933',
  fontWeight: 600,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const shapeStyle: React.CSSProperties = {
  color: '#FFAA44',
  fontSize: '11px',
  fontWeight: 500,
};

const countStyle: React.CSSProperties = {
  color: '#ccc',
  fontSize: '11px',
};

const warningStyle: React.CSSProperties = {
  color: '#f0c040',
  fontSize: '11px',
};

const separator: React.CSSProperties = {
  color: 'rgba(220,150,60,0.4)',
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
  backgroundColor: 'rgba(220, 140, 40, 0.85)',
  color: '#fff',
};

const cancelButtonStyle: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: 'rgba(100, 100, 120, 0.6)',
  color: '#ccc',
};

const SHAPE_LABELS: Record<string, string> = {
  polyline: 'Polyline',
  clothoid: 'Clothoid',
  nurbs: 'NURBS',
};

const POINT_LABELS: Record<string, string> = {
  polyline: 'vertices',
  clothoid: 'origin',
  nurbs: 'control pts',
};

export const TrajectoryEditOverlay: React.FC<TrajectoryEditOverlayProps> = React.memo(
  ({ shapeType, pointCount, warnings, onSave, onCancel }) => {
    return (
      <div style={overlayStyle}>
        <span style={labelStyle}>Trajectory Edit</span>
        <span style={separator}>|</span>
        <span style={shapeStyle}>{SHAPE_LABELS[shapeType]}</span>
        <span style={separator}>|</span>
        <span style={countStyle}>
          {pointCount} {POINT_LABELS[shapeType]}
        </span>

        {warnings.length > 0 && (
          <>
            <span style={separator}>|</span>
            <span style={warningStyle}>{warnings[0]}</span>
          </>
        )}

        <span style={separator}>|</span>

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

TrajectoryEditOverlay.displayName = 'TrajectoryEditOverlay';
