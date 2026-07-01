/**
 * Renders line segments connecting waypoints in a route.
 * Thin wrapper around the shared {@link EditConnectionLine} with the route colour.
 */

import React from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { EditConnectionLine } from '../edit-shared/EditConnectionLine.js';
import { ROUTE_EDIT_THEME } from '../edit-shared/edit-theme.js';

interface RouteConnectionLineProps {
  points: Array<{ x: number; y: number; z: number }>;
  segmentIndex: number;
  color?: string;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

export const RouteConnectionLine: React.FC<RouteConnectionLineProps> = React.memo(
  ({ points, color = ROUTE_EDIT_THEME.lineColor, onClick }) => (
    <EditConnectionLine points={points} color={color} lineWidth={3} onClick={onClick} />
  ),
);

RouteConnectionLine.displayName = 'RouteConnectionLine';
