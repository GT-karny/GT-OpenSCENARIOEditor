/**
 * Renders a diamond/rhombus marker at a route waypoint position.
 * Thin wrapper around the shared {@link EditPointMarker} with the route (cyan) theme.
 */

import React from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { EditPointMarker } from '../edit-shared/EditPointMarker.js';
import { ROUTE_EDIT_THEME } from '../edit-shared/edit-theme.js';

interface WaypointMarkerProps {
  position: [number, number, number];
  heading: number;
  index: number;
  isSelected: boolean;
  onClick?: () => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
}

export const WaypointMarker: React.FC<WaypointMarkerProps> = React.memo((props) => (
  <EditPointMarker {...props} theme={ROUTE_EDIT_THEME} />
));

WaypointMarker.displayName = 'WaypointMarker';
