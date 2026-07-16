/**
 * React Three Fiber Canvas wrapper for the 3D viewer.
 */

import React, { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { RootState } from '@react-three/fiber';
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
  // Paused while the WebGL context is lost so R3F stops issuing draw calls
  // into a dead context (three.js's WebGLRenderer already no-ops internally,
  // but per-frame work in useFrame callbacks throughout the tree keeps running
  // otherwise, which is where a lost-context session tends to wedge the app).
  // Resumes automatically once the browser restores the context — see
  // https://threejs.org/docs/#api/en/renderers/WebGLRenderer (context loss).
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');

  const handleCreated = useCallback((state: RootState) => {
    const canvas = state.gl.domElement;

    const handleContextLost = (event: Event): void => {
      // preventDefault is required for the browser to attempt an automatic
      // context restore later (without it, the loss is permanent).
      event.preventDefault();
      console.warn('[3d-viewer] WebGL context lost — pausing render loop.');
      setFrameloop('never');
    };
    const handleContextRestored = (): void => {
      console.warn('[3d-viewer] WebGL context restored — resuming render loop.');
      setFrameloop('always');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
  }, []);

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
      frameloop={frameloop}
      onCreated={handleCreated}
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
