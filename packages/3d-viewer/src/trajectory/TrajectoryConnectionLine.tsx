/**
 * Renders line segments connecting trajectory points.
 * Thin wrapper around the shared {@link EditConnectionLine} with the trajectory colour.
 */

import React from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { EditConnectionLine } from '../edit-shared/EditConnectionLine.js';
import { TRAJECTORY_EDIT_THEME } from '../edit-shared/edit-theme.js';

interface TrajectoryConnectionLineProps {
  points: Array<{ x: number; y: number; z: number }>;
  color?: string;
  lineWidth?: number;
  dashed?: boolean;
  dashSize?: number;
  gapSize?: number;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

export const TrajectoryConnectionLine: React.FC<TrajectoryConnectionLineProps> = React.memo(
  ({ points, color = TRAJECTORY_EDIT_THEME.lineColor, ...rest }) => (
    <EditConnectionLine points={points} color={color} {...rest} />
  ),
);

TrajectoryConnectionLine.displayName = 'TrajectoryConnectionLine';
