/**
 * Read-only trajectory preview overlay for displaying trajectories associated with
 * a selected entity or action. Uses dimmer colors (orange-themed) and no interaction
 * handlers to distinguish from the active trajectory editor.
 *
 * For NURBS shapes, also renders the dashed control polygon.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';

type Point3 = { x: number; y: number; z: number };

export interface TrajectoryPreviewData {
  shapeType: 'polyline' | 'clothoid' | 'nurbs';
  points: Array<{ x: number; y: number; z: number; h: number }>;
  curvePoints: Point3[];
}

export interface TrajectoryPreviewOverlayProps {
  previews: TrajectoryPreviewData[];
}

const PREVIEW_CURVE_COLOR = '#CC6600';
const PREVIEW_CONTROL_POLYGON_COLOR = '#CC660066';
const PREVIEW_MARKER_COLOR = '#CC6600';
const Z_OFFSET = 0.15;

const PreviewCurveLine: React.FC<{ points: Point3[] }> = React.memo(({ points }) => {
  const linePoints = useMemo(
    () => points.map((p) => [p.x, p.y, p.z + Z_OFFSET] as [number, number, number]),
    [points],
  );

  if (linePoints.length < 2) return null;

  return (
    <Line
      points={linePoints}
      color={PREVIEW_CURVE_COLOR}
      lineWidth={2}
      transparent
      opacity={0.5}
    />
  );
});

PreviewCurveLine.displayName = 'PreviewCurveLine';

const PreviewControlPolygon: React.FC<{ points: Point3[] }> = React.memo(({ points }) => {
  const linePoints = useMemo(
    () => points.map((p) => [p.x, p.y, p.z + Z_OFFSET] as [number, number, number]),
    [points],
  );

  if (linePoints.length < 2) return null;

  return (
    <Line
      points={linePoints}
      color={PREVIEW_CONTROL_POLYGON_COLOR}
      lineWidth={1}
      transparent
      opacity={0.3}
      dashed
      dashSize={0.5}
      gapSize={0.3}
    />
  );
});

PreviewControlPolygon.displayName = 'PreviewControlPolygon';

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

export const TrajectoryPreviewOverlay: React.FC<TrajectoryPreviewOverlayProps> = React.memo(
  ({ previews }) => {
    if (previews.length === 0) return null;

    return (
      <group>
        {previews.map((preview, pIdx) => (
          <group key={`traj-preview-${pIdx}`}>
            {/* Evaluated curve line */}
            {preview.curvePoints.length >= 2 && (
              <PreviewCurveLine points={preview.curvePoints} />
            )}

            {/* NURBS control polygon (dashed) */}
            {preview.shapeType === 'nurbs' && preview.points.length >= 2 && (
              <PreviewControlPolygon points={preview.points} />
            )}

            {/* Control point / vertex markers */}
            {preview.points.map((pt, mIdx) => (
              <PreviewMarker
                key={`traj-preview-marker-${pIdx}-${mIdx}`}
                position={[pt.x, pt.y, pt.z]}
                heading={pt.h}
              />
            ))}
          </group>
        ))}
      </group>
    );
  },
);

TrajectoryPreviewOverlay.displayName = 'TrajectoryPreviewOverlay';
