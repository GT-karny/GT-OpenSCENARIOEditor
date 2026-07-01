/**
 * Read-only preview primitives shared by the route and trajectory preview overlays.
 *
 * Previews render dimmed, non-interactive markers and lines for routes/trajectories
 * associated with the current selection (distinct from the active editors). Both
 * overlays used the same octahedron marker and dashed/solid preview line, so those
 * live here parameterized by colour.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';

const Z_OFFSET = 0.15;

type Point3 = { x: number; y: number; z: number };

interface EditPreviewLineProps {
  points: Point3[];
  color: string;
  lineWidth?: number;
  opacity?: number;
  dashed?: boolean;
  dashSize?: number;
  gapSize?: number;
}

export const EditPreviewLine: React.FC<EditPreviewLineProps> = React.memo(
  ({ points, color, lineWidth = 2, opacity = 0.5, dashed = false, dashSize = 0.5, gapSize = 0.3 }) => {
    const linePoints = useMemo(
      () => points.map((p) => [p.x, p.y, p.z + Z_OFFSET] as [number, number, number]),
      [points],
    );

    if (linePoints.length < 2) return null;

    return (
      <Line
        points={linePoints}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        dashed={dashed}
        dashSize={dashSize}
        gapSize={gapSize}
      />
    );
  },
);

EditPreviewLine.displayName = 'EditPreviewLine';

interface EditPreviewMarkerProps {
  position: [number, number, number];
  heading: number;
  color: string;
}

export const EditPreviewMarker: React.FC<EditPreviewMarkerProps> = React.memo(
  ({ position, heading, color }) => (
    <group position={position} rotation={[0, 0, heading]}>
      <mesh scale={[0.6, 0.9, 0.6]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.4} />
      </mesh>
    </group>
  ),
);

EditPreviewMarker.displayName = 'EditPreviewMarker';
