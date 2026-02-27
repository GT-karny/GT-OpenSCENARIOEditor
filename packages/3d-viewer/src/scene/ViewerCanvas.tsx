/**
 * React Three Fiber Canvas wrapper for the 3D viewer.
 */

import React from 'react';
import { Canvas } from '@react-three/fiber';

interface ViewerCanvasProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ViewerCanvas: React.FC<ViewerCanvasProps> = ({ children, className, style }) => {
  return (
    <Canvas
      camera={{
        position: [0, 50, 50],
        fov: 60,
        near: 0.1,
        far: 5000,
      }}
      style={{ background: '#1a1a2e', ...style }}
      className={className}
      gl={{ antialias: true }}
      shadows
    >
      {children}
    </Canvas>
  );
};

ViewerCanvas.displayName = 'ViewerCanvas';
