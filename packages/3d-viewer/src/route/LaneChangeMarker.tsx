/**
 * Renders a marker at a point where a lane change is required along a
 * lane-change-aware route (GT_esmini router). Visually distinct from the
 * waypoint diamonds: an orange ring with a "fromLane → toLane" label.
 */

import React from 'react';
import { Html } from '@react-three/drei';

interface LaneChangeMarkerProps {
  position: [number, number, number];
  fromLane: number;
  toLane: number;
}

const MARKER_COLOR = '#FF8A1E';

export const LaneChangeMarker: React.FC<LaneChangeMarkerProps> = React.memo(
  ({ position, fromLane, toLane }) => {
    return (
      <group position={position}>
        {/* Flat ring lying on the ground plane (z up in road space) */}
        <mesh>
          <ringGeometry args={[0.9, 1.3, 24]} />
          <meshBasicMaterial color={MARKER_COLOR} depthTest={false} transparent opacity={0.85} />
        </mesh>

        {/* Lane-change label */}
        <Html
          position={[0, 0, 1.8]}
          center
          style={{
            fontSize: '11px',
            color: '#FFFFFF',
            backgroundColor: 'rgba(120,60,0,0.85)',
            padding: '1px 5px',
            borderRadius: '3px',
            border: `1px solid ${MARKER_COLOR}`,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            fontFamily: 'monospace',
            fontWeight: 'bold',
          }}
        >
          {`${fromLane} → ${toLane}`}
        </Html>
      </group>
    );
  },
);

LaneChangeMarker.displayName = 'LaneChangeMarker';
