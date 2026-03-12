/**
 * Read-only route preview overlay for displaying routes associated with
 * a selected entity or action. Uses dimmer colors and no interaction handlers
 * to distinguish from the active route editor.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';

type Point3 = { x: number; y: number; z: number };

export interface RoutePreviewData {
  waypoints: Array<{ x: number; y: number; z: number; h: number }>;
  pathSegments: Array<Point3[]>;
}

export interface RoutePreviewOverlayProps {
  previews: RoutePreviewData[];
}

const PREVIEW_LINE_COLOR = '#4488CC';
const PREVIEW_MARKER_COLOR = '#4488CC';
const Z_OFFSET = 0.15;

const PreviewConnectionLine: React.FC<{ points: Point3[]; index: number }> = React.memo(
  ({ points, index }) => {
    const linePoints = useMemo(
      () => points.map((p) => [p.x, p.y, p.z + Z_OFFSET] as [number, number, number]),
      [points],
    );

    if (linePoints.length < 2) return null;

    return (
      <Line
        key={`preview-line-${index}`}
        points={linePoints}
        color={PREVIEW_LINE_COLOR}
        lineWidth={2}
        transparent
        opacity={0.5}
      />
    );
  },
);

PreviewConnectionLine.displayName = 'PreviewConnectionLine';

const PreviewMarker: React.FC<{
  position: [number, number, number];
  heading: number;
}> = React.memo(({ position, heading }) => {
  return (
    <group position={position} rotation={[0, 0, heading]}>
      <mesh scale={[0.6, 0.9, 0.6]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial
          color={PREVIEW_MARKER_COLOR}
          depthTest={false}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
});

PreviewMarker.displayName = 'PreviewMarker';

export const RoutePreviewOverlay: React.FC<RoutePreviewOverlayProps> = React.memo(
  ({ previews }) => {
    if (previews.length === 0) return null;

    return (
      <group>
        {previews.map((preview, pIdx) => (
          <group key={`route-preview-${pIdx}`}>
            {/* Connection lines */}
            {preview.pathSegments.map((segment, sIdx) => (
              <PreviewConnectionLine
                key={`preview-seg-${pIdx}-${sIdx}`}
                points={segment}
                index={sIdx}
              />
            ))}

            {/* Waypoint markers */}
            {preview.waypoints.map((wp, wIdx) => (
              <PreviewMarker
                key={`preview-wp-${pIdx}-${wIdx}`}
                position={[wp.x, wp.y, wp.z]}
                heading={wp.h}
              />
            ))}
          </group>
        ))}
      </group>
    );
  },
);

RoutePreviewOverlay.displayName = 'RoutePreviewOverlay';
