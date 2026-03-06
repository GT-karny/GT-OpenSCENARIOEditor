/**
 * Renders a floating name label above an entity using drei's Html component.
 */

import React from 'react';
import { Html } from '@react-three/drei';

interface EntityLabelProps {
  name: string;
  position: [number, number, number];
  isSelected: boolean;
  isHovered?: boolean;
}

export const EntityLabel: React.FC<EntityLabelProps> = React.memo(
  ({ name, position, isSelected, isHovered }) => {
    const color = isSelected ? '#FFFF00' : isHovered ? '#44DDFF' : '#FFFFFF';
    const bg = isSelected
      ? 'rgba(60,60,0,0.8)'
      : isHovered
        ? 'rgba(0,60,90,0.9)'
        : 'rgba(0,0,0,0.6)';
    const border = isSelected
      ? '1px solid #FFFF00'
      : isHovered
        ? '1px solid #44DDFF'
        : '1px solid transparent';
    const shadow = isHovered ? '0 0 8px #44DDFF, 0 0 16px rgba(68,221,255,0.4)' : 'none';

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
