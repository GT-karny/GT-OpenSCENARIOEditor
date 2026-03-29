/**
 * Renders a floating name label above an entity using drei's Html component.
 */

import React from 'react';
import { Html } from '@react-three/drei';
import { LABEL_COLORS } from '../constants/selection-theme.js';

interface EntityLabelProps {
  name: string;
  position: [number, number, number];
  isSelected: boolean;
  isHovered?: boolean;
}

export const EntityLabel: React.FC<EntityLabelProps> = React.memo(
  ({ name, position, isSelected, isHovered }) => {
    const theme = isSelected
      ? LABEL_COLORS.entity.selected
      : isHovered
        ? LABEL_COLORS.entity.hovered
        : LABEL_COLORS.entity.normal;
    const color = theme.text;
    const bg = theme.bg;
    const border = `1px solid ${theme.border}`;
    const shadow = 'shadow' in theme ? theme.shadow : 'none';

    return (
      <Html
        position={position}
        center
        occlude
        style={{
          fontSize: isHovered ? '12px' : '11px',
          fontWeight: isHovered ? 'bold' : 'normal',
          color,
          backgroundColor: bg,
          padding: isHovered ? '3px 8px' : '2px 6px',
          borderRadius: '3px',
          border,
          boxShadow: shadow,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: 'monospace',
          transition: 'all 0.15s ease',
        }}
      >
        {name}
      </Html>
    );
  },
);

EntityLabel.displayName = 'EntityLabel';
