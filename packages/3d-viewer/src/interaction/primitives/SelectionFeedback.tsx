/**
 * Unified selection/hover visual feedback component.
 *
 * Wraps ApexEdgeGlow to provide a consistent API across all selectable 3D objects.
 * Must be placed as a child of a <mesh>.
 *
 * - state=null: cursor-reactive APEX edge glow (default)
 * - state="selected": yellow outline
 * - state="hovered": cyan outline
 *
 * Size variants control outline thickness:
 * - "normal": standard entity (vehicle) — 0.08/0.15
 * - "small": smaller entity (pedestrian, misc) — 0.06/0.12
 * - "signal": traffic signal — 1.6/3.0
 */

import React from 'react';
import { ApexEdgeGlow } from '../../materials/ApexEdgeGlow.js';
import { SELECTION_COLORS, OUTLINE_THICKNESS } from '../../constants/selection-theme.js';

export type SelectionState = 'selected' | 'hovered' | null;
export type SelectionSize = 'normal' | 'small' | 'signal';

interface SelectionFeedbackProps {
  state: SelectionState;
  size?: SelectionSize;
}

function getThickness(state: 'selected' | 'hovered', size: SelectionSize): number {
  const thicknessMap = OUTLINE_THICKNESS[state];
  switch (size) {
    case 'small':
      return thicknessMap.entitySmall;
    case 'signal':
      return thicknessMap.signal;
    default:
      return thicknessMap.entity;
  }
}

export const SelectionFeedback: React.FC<SelectionFeedbackProps> = React.memo(
  ({ state, size = 'normal' }) => {
    if (!state) {
      return <ApexEdgeGlow />;
    }

    return (
      <ApexEdgeGlow
        overrideColor={SELECTION_COLORS[state]}
        overrideThickness={getThickness(state, size)}
      />
    );
  },
);

SelectionFeedback.displayName = 'SelectionFeedback';
