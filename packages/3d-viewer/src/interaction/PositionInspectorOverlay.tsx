/**
 * HTML overlay showing coordinate information when hovering over road surface.
 * Displays World, Road, and Lane coordinates in real-time.
 * Rendered outside the R3F Canvas as a sibling overlay.
 */

import React from 'react';
import type { HoverLaneInfo } from '../store/viewer-types.js';

interface PositionInspectorOverlayProps {
  hoverLaneInfo: HoverLaneInfo | null;
  visible: boolean;
  /** Whether pick mode is active (shows pick mode indicator) */
  pickModeActive?: boolean;
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 8,
  left: 8,
  padding: '6px 10px',
  backgroundColor: 'rgba(40, 40, 60, 0.9)',
  border: '1px solid rgba(100, 100, 140, 0.5)',
  borderRadius: '0px',
  zIndex: 10,
  pointerEvents: 'none',
  fontFamily: 'monospace',
  fontSize: '11px',
  color: '#ddd',
  lineHeight: '1.6',
  minWidth: '220px',
};

const pickModeOverlayStyle: React.CSSProperties = {
  ...overlayStyle,
  borderColor: 'rgba(220, 160, 60, 0.8)',
};

const labelStyle: React.CSSProperties = {
  color: '#888',
  display: 'inline-block',
  width: '42px',
};

const pickBadgeStyle: React.CSSProperties = {
  color: '#f0b040',
  fontWeight: 'bold',
  marginBottom: '4px',
};

function radToDeg(rad: number): string {
  return ((rad * 180) / Math.PI).toFixed(1);
}

export const PositionInspectorOverlay: React.FC<PositionInspectorOverlayProps> = React.memo(
  ({ hoverLaneInfo, visible, pickModeActive = false }) => {
    if (!visible && !pickModeActive) return null;

    if (!hoverLaneInfo) {
      if (pickModeActive) {
        return (
          <div style={pickModeOverlayStyle}>
            <div style={pickBadgeStyle}>PICK MODE</div>
            <div>Hover over road to see coordinates</div>
            <div style={{ color: '#888', marginTop: '2px' }}>Press Esc to cancel</div>
          </div>
        );
      }
      return null;
    }

    return (
      <div style={pickModeActive ? pickModeOverlayStyle : overlayStyle}>
        {pickModeActive && (
          <div style={pickBadgeStyle}>PICK MODE — Click to select position</div>
        )}
        <div>
          <span style={labelStyle}>World</span>
          ({hoverLaneInfo.worldX.toFixed(2)}, {hoverLaneInfo.worldY.toFixed(2)},{' '}
          {hoverLaneInfo.worldZ.toFixed(2)})
        </div>
        <div>
          <span style={labelStyle}>Road</span>
          {hoverLaneInfo.roadId} &nbsp;s={hoverLaneInfo.s.toFixed(2)} &nbsp;t=
          {hoverLaneInfo.roadT.toFixed(2)}
        </div>
        <div>
          <span style={labelStyle}>Lane</span>
          {hoverLaneInfo.roadId} &nbsp;lane={hoverLaneInfo.laneId} &nbsp;s=
          {hoverLaneInfo.s.toFixed(2)} &nbsp;off={hoverLaneInfo.offset.toFixed(2)}
        </div>
        <div>
          <span style={labelStyle}>Hdg</span>
          {hoverLaneInfo.heading.toFixed(3)} rad ({radToDeg(hoverLaneInfo.heading)}&deg;)
        </div>
        {pickModeActive && (
          <div style={{ color: '#888', marginTop: '2px' }}>Press Esc to cancel</div>
        )}
      </div>
    );
  },
);

PositionInspectorOverlay.displayName = 'PositionInspectorOverlay';
