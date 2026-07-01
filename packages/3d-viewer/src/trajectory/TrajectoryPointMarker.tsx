/**
 * Renders a diamond marker at a trajectory point (vertex or control point).
 * Thin wrapper around the shared {@link EditPointMarker} with the trajectory
 * (orange/amber) theme, optionally showing a time badge.
 */

import React from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { EditPointMarker } from '../edit-shared/EditPointMarker.js';
import { TRAJECTORY_EDIT_THEME } from '../edit-shared/edit-theme.js';

interface TrajectoryPointMarkerProps {
  position: [number, number, number];
  heading: number;
  index: number;
  isSelected: boolean;
  time?: number;
  onClick?: () => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
}

export const TrajectoryPointMarker: React.FC<TrajectoryPointMarkerProps> = React.memo((props) => (
  <EditPointMarker {...props} theme={TRAJECTORY_EDIT_THEME} />
));

TrajectoryPointMarker.displayName = 'TrajectoryPointMarker';
