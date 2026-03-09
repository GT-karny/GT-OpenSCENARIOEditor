/**
 * Renders a floating name label above a traffic signal using drei's Html component.
 * Same pattern as EntityLabel.
 */

import React from 'react';
import { Html } from '@react-three/drei';

interface SignalLabelProps {
  name: string;
  position: [number, number, number];
}

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#BBDDFF',
  backgroundColor: 'rgba(0, 20, 40, 0.7)',
  padding: '1px 5px',
  borderRadius: '3px',
  border: '1px solid rgba(80, 120, 180, 0.4)',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  userSelect: 'none',
  fontFamily: 'monospace',
};

export const SignalLabel: React.FC<SignalLabelProps> = React.memo(({ name, position }) => {
  return (
    <Html position={position} center occlude style={labelStyle}>
      {name}
    </Html>
  );
});

SignalLabel.displayName = 'SignalLabel';
