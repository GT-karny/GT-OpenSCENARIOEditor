/**
 * Container component that renders all route waypoint markers
 * and connection lines. Placed inside the road network rotation group
 * so input coordinates are in OpenDRIVE space (x/y ground, z up).
 */

import React from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { WaypointMarker } from './WaypointMarker.js';
import { RouteConnectionLine } from './RouteConnectionLine.js';

export interface RouteOverlayProps {
  waypoints: Array<{ x: number; y: number; z: number; h: number }>;
  pathSegments: Array<Array<{ x: number; y: number; z: number }>>;
  selectedWaypointIndex: number | null;
  onWaypointClick?: (index: number) => void;
  onWaypointContextMenu?: (index: number, event: ThreeEvent<MouseEvent>) => void;
  onLineClick?: (segmentIndex: number, event: ThreeEvent<MouseEvent>) => void;
}

export const RouteOverlay: React.FC<RouteOverlayProps> = React.memo(
  ({
    waypoints,
    pathSegments,
    selectedWaypointIndex,
    onWaypointClick,
    onWaypointContextMenu,
    onLineClick,
  }) => {
    return (
      <group>
        {/* Connection lines between waypoints */}
        {pathSegments.map((segment, idx) => (
          <RouteConnectionLine
            key={`route-seg-${idx}`}
            points={segment}
            segmentIndex={idx}
            onClick={onLineClick ? (e) => onLineClick(idx, e) : undefined}
          />
        ))}

        {/* Waypoint markers */}
        {waypoints.map((wp, idx) => (
          <WaypointMarker
            key={`route-wp-${idx}`}
            position={[wp.x, wp.y, wp.z]}
            heading={wp.h}
            index={idx}
            isSelected={idx === selectedWaypointIndex}
            onClick={onWaypointClick ? () => onWaypointClick(idx) : undefined}
            onContextMenu={
              onWaypointContextMenu ? (e) => onWaypointContextMenu(idx, e) : undefined
            }
          />
        ))}
      </group>
    );
  },
);

RouteOverlay.displayName = 'RouteOverlay';
