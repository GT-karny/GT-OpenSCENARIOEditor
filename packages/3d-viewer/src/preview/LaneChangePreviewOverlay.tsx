/**
 * Read-only lane-change preview overlay: renders the lateral-transition path a
 * selected entity/action would follow during a LaneChangeAction.
 *
 * Uses a teal-green (APEX `success` family, #5DD8A8) at 50% opacity to
 * distinguish it from the blue route preview and orange trajectory preview.
 * Reuses the shared EditPreviewLine primitive; no interaction handlers.
 */

import React from 'react';
import { EditPreviewLine } from '../edit-shared/EditPreviewPrimitives.js';

type Point3 = { x: number; y: number; z: number };

export interface LaneChangePreviewData {
  /** Sampled world path from the current lane centre to the target lane centre. */
  points: Point3[];
}

export interface LaneChangePreviewOverlayProps {
  previews: LaneChangePreviewData[];
}

/** APEX success/teal color for lane-change previews. */
const PREVIEW_COLOR = '#5DD8A8';

export const LaneChangePreviewOverlay: React.FC<LaneChangePreviewOverlayProps> = React.memo(
  ({ previews }) => {
    if (previews.length === 0) return null;

    return (
      <group>
        {previews.map((preview, pIdx) =>
          preview.points.length >= 2 ? (
            <EditPreviewLine
              key={`lane-change-preview-${pIdx}`}
              points={preview.points}
              color={PREVIEW_COLOR}
              opacity={0.5}
            />
          ) : null,
        )}
      </group>
    );
  },
);

LaneChangePreviewOverlay.displayName = 'LaneChangePreviewOverlay';
