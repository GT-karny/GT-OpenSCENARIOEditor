/**
 * Renders a floating name label above an entity using drei's Html component.
 */

import React from 'react';
import { Html } from '@react-three/drei';

interface EntityLabelProps {
  name: string;
  position: [number, number, number];
  isSelected: boolean;
}

export const EntityLabel: React.FC<EntityLabelProps> = React.memo(
  ({ name, position, isSelected }) => {
    return (
      <Html
        position={position}
        center
        occlude
        style={{
          fontSize: '11px',
          color: isSelected ? '#FFFF00' : '#FFFFFF',
          backgroundColor: isSelected ? 'rgba(60,60,0,0.8)' : 'rgba(0,0,0,0.6)',
          padding: '2px 6px',
          borderRadius: '3px',
          border: isSelected ? '1px solid #FFFF00' : '1px solid transparent',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: 'monospace',
        }}
      >
        {name}
      </Html>
    );
  },
);

EntityLabel.displayName = 'EntityLabel';
