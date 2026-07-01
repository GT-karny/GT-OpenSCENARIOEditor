/**
 * Read-only route preview overlay for displaying routes associated with
 * a selected entity or action. Uses dimmer colors and no interaction handlers
 * to distinguish from the active route editor.
 */

import React from 'react';
import { EditPreviewLine, EditPreviewMarker } from '../edit-shared/EditPreviewPrimitives.js';

type Point3 = { x: number; y: number; z: number; h?: number };

export interface RoutePreviewData {
  waypoints: Array<{ x: number; y: number; z: number; h: number }>;
  pathSegments: Array<Point3[]>;
}

export interface RoutePreviewOverlayProps {
  previews: RoutePreviewData[];
}

const PREVIEW_COLOR = '#4488CC';

export const RoutePreviewOverlay: React.FC<RoutePreviewOverlayProps> = React.memo(
  ({ previews }) => {
    if (previews.length === 0) return null;

    return (
      <group>
        {previews.map((preview, pIdx) => (
          <group key={`route-preview-${pIdx}`}>
            {/* Connection lines */}
            {preview.pathSegments.map((segment, sIdx) => (
              <EditPreviewLine
                key={`preview-seg-${pIdx}-${sIdx}`}
                points={segment}
                color={PREVIEW_COLOR}
              />
            ))}

            {/* Waypoint markers */}
            {preview.waypoints.map((wp, wIdx) => (
              <EditPreviewMarker
                key={`preview-wp-${pIdx}-${wIdx}`}
                position={[wp.x, wp.y, wp.z]}
                heading={wp.h}
                color={PREVIEW_COLOR}
              />
            ))}
          </group>
        ))}
      </group>
    );
  },
);

RoutePreviewOverlay.displayName = 'RoutePreviewOverlay';
