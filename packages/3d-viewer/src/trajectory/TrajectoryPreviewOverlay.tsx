/**
 * Read-only trajectory preview overlay for displaying trajectories associated with
 * a selected entity or action. Uses dimmer colors (orange-themed) and no interaction
 * handlers to distinguish from the active trajectory editor.
 *
 * For NURBS shapes, also renders the dashed control polygon.
 */

import React from 'react';
import { EditPreviewLine, EditPreviewMarker } from '../edit-shared/EditPreviewPrimitives.js';

type Point3 = { x: number; y: number; z: number };

export interface TrajectoryPreviewData {
  shapeType: 'polyline' | 'clothoid' | 'nurbs' | 'clothoidSpline';
  points: Array<{ x: number; y: number; z: number; h: number }>;
  curvePoints: Point3[];
}

export interface TrajectoryPreviewOverlayProps {
  previews: TrajectoryPreviewData[];
}

const PREVIEW_CURVE_COLOR = '#CC6600';
const PREVIEW_CONTROL_POLYGON_COLOR = '#CC660066';
const PREVIEW_MARKER_COLOR = '#CC6600';

export const TrajectoryPreviewOverlay: React.FC<TrajectoryPreviewOverlayProps> = React.memo(
  ({ previews }) => {
    if (previews.length === 0) return null;

    return (
      <group>
        {previews.map((preview, pIdx) => (
          <group key={`traj-preview-${pIdx}`}>
            {/* Evaluated curve line */}
            {preview.curvePoints.length >= 2 && (
              <EditPreviewLine points={preview.curvePoints} color={PREVIEW_CURVE_COLOR} />
            )}

            {/* NURBS control polygon (dashed) */}
            {preview.shapeType === 'nurbs' && preview.points.length >= 2 && (
              <EditPreviewLine
                points={preview.points}
                color={PREVIEW_CONTROL_POLYGON_COLOR}
                lineWidth={1}
                opacity={0.3}
                dashed
              />
            )}

            {/* Control point / vertex markers */}
            {preview.points.map((pt, mIdx) => (
              <EditPreviewMarker
                key={`traj-preview-marker-${pIdx}-${mIdx}`}
                position={[pt.x, pt.y, pt.z]}
                heading={pt.h}
                color={PREVIEW_MARKER_COLOR}
              />
            ))}
          </group>
        ))}
      </group>
    );
  },
);

TrajectoryPreviewOverlay.displayName = 'TrajectoryPreviewOverlay';
