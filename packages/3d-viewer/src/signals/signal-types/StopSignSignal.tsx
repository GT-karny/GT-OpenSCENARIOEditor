/**
 * Renders an octagonal stop sign.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { STOP_SIGN } from '../../utils/signal-geometry.js';

const { radius, faceColor, borderColor, borderWidth } = STOP_SIGN;

function createOctagonShape(r: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 8) + (i * Math.PI) / 4;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export const StopSignSignal: React.FC = React.memo(() => {
  const outerShape = useMemo(() => createOctagonShape(radius), []);
  const innerShape = useMemo(() => createOctagonShape(radius - borderWidth), []);

  return (
    <group>
      {/* Border (outer octagon) */}
      <mesh>
        <shapeGeometry args={[outerShape]} />
        <meshStandardMaterial color={borderColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Red face (inner octagon, slightly in front) */}
      <mesh position={[0, 0, 0.005]}>
        <shapeGeometry args={[innerShape]} />
        <meshStandardMaterial color={faceColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
});

StopSignSignal.displayName = 'StopSignSignal';
