/**
 * HTML overlay showing snap target information during Place mode.
 * Rendered outside the R3F Canvas as a sibling to the toolbar.
 */

import React from 'react';
import type { HoverLaneInfo } from '../store/viewer-types.js';

interface PlacementOverlayProps {
  hoverLaneInfo: HoverLaneInfo | null;
  snapToLane: boolean;
  isPlaceMode: boolean;
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 8,
  left: 8,
  padding: '6px 10px',
  backgroundColor: 'rgba(40, 40, 60, 0.9)',
  border: '1px solid rgba(100, 100, 140, 0.5)',
  borderRadius: '4px',
  zIndex: 10,
  pointerEvents: 'none',
  fontFamily: 'monospace',
  fontSize: '11px',
  color: '#ddd',
  lineHeight: '1.5',
};

export const PlacementOverlay: React.FC<PlacementOverlayProps> = React.memo(
  ({ hoverLaneInfo, snapToLane, isPlaceMode }) => {
    if (!isPlaceMode || !hoverLaneInfo) return null;

    return (
      <div style={overlayStyle}>
        <div>
          Road: {hoverLaneInfo.roadId}, Lane: {hoverLaneInfo.laneId}
        </div>
        <div>s: {hoverLaneInfo.s.toFixed(1)}m</div>
        {snapToLane ? (
          <div style={{ color: '#6cb6ff' }}>Snap: Lane Center</div>
        ) : (
          <div>
            Pos: ({hoverLaneInfo.worldX.toFixed(1)}, {hoverLaneInfo.worldY.toFixed(1)})
          </div>
        )}
      </div>
    );
  },
);

PlacementOverlay.displayName = 'PlacementOverlay';
