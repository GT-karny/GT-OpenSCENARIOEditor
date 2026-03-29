/**
 * React Three Fiber Canvas wrapper for the 3D viewer.
 */

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { GLInfo } from './GLInfo.js';

interface ViewerCanvasProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Show performance overlay (FPS + draw calls + triangles) */
  showPerf?: boolean;
}

export const ViewerCanvas: React.FC<ViewerCanvasProps> = ({
  children,
  className,
  style,
  showPerf = false,
}) => {
  return (
    <Canvas
      camera={{
        position: [0, 50, 50],
        fov: 60,
        near: 0.1,
        far: 5000,
      }}
      style={{ background: '#0e0a1f', ...style }}
      className={className}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
      shadows
    >
      {showPerf && (
        <>
          <Stats className="perf-stats" />
          <GLInfo />
        </>
      )}
      {children}
    </Canvas>
  );
};

ViewerCanvas.displayName = 'ViewerCanvas';
