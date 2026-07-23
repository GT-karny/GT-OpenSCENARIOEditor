/**
 * React Three Fiber Canvas wrapper for the 3D viewer.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { RootState } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { GLInfo } from './GLInfo.js';
import { createContextRecoveryController } from './context-recovery.js';
import type { ContextRecoveryController } from './context-recovery.js';

interface ViewerCanvasProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Show performance overlay (FPS + draw calls + triangles) */
  showPerf?: boolean;
  /**
   * Called once automatic context-loss recovery gives up after repeated
   * consecutive failures (see context-recovery.ts). The 3D view has stopped
   * rendering and will not retry again on its own. This package has no i18n
   * dependency of its own, so the caller is responsible for surfacing a
   * user-facing (localized) message.
   */
  onGpuRecoveryExhausted?: () => void;
}

export const ViewerCanvas: React.FC<ViewerCanvasProps> = ({
  children,
  className,
  style,
  showPerf = false,
  onGpuRecoveryExhausted,
}) => {
  // Paused while the WebGL context is lost so R3F stops issuing draw calls
  // into a dead context (three.js's WebGLRenderer already no-ops internally,
  // but per-frame work in useFrame callbacks throughout the tree keeps running
  // otherwise, which is where a lost-context session tends to wedge the app).
  // Resumes automatically once the browser restores the context — see
  // https://threejs.org/docs/#api/en/renderers/WebGLRenderer (context loss).
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');

  // Bumped to force a full Canvas remount (and therefore a brand-new
  // WebGLRenderer/context) when the browser never fires
  // `webglcontextrestored` for a lost context. Scene state that lives
  // outside the Canvas (the viewer Zustand store, props from the host app)
  // survives the remount naturally; only in-Canvas-only state such as the
  // OrbitControls camera position resets, which is an accepted trade-off.
  const [canvasGeneration, setCanvasGeneration] = useState(0);

  // Keep the latest callback in a ref so the recovery controller (created
  // once, see below) always invokes the current callback without needing to
  // be recreated when the prop identity changes.
  const onGpuRecoveryExhaustedRef = useRef(onGpuRecoveryExhausted);
  onGpuRecoveryExhaustedRef.current = onGpuRecoveryExhausted;

  // Created once and kept alive across canvas remounts so it can track a
  // failure streak spanning multiple context losses.
  const recoveryRef = useRef<ContextRecoveryController | null>(null);
  if (recoveryRef.current === null) {
    recoveryRef.current = createContextRecoveryController({
      onRemount: () => {
        console.warn('[3d-viewer] No context restore after timeout — forcing canvas remount.');
        setFrameloop('always');
        setCanvasGeneration((generation) => generation + 1);
      },
      onGiveUp: () => {
        console.warn(
          '[3d-viewer] Giving up on WebGL context recovery after repeated consecutive failures.',
        );
        onGpuRecoveryExhaustedRef.current?.();
      },
    });
  }

  useEffect(() => {
    const recovery = recoveryRef.current;
    return () => recovery?.dispose();
  }, []);

  const handleCreated = useCallback((state: RootState) => {
    const canvas = state.gl.domElement;

    const handleContextLost = (event: Event): void => {
      // preventDefault is required for the browser to attempt an automatic
      // context restore later (without it, the loss is permanent).
      event.preventDefault();
      console.warn('[3d-viewer] WebGL context lost — pausing render loop.');
      setFrameloop('never');
      recoveryRef.current?.handleContextLost();
    };
    const handleContextRestored = (): void => {
      console.warn('[3d-viewer] WebGL context restored — resuming render loop.');
      setFrameloop('always');
      recoveryRef.current?.handleContextRestored();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // A fresh context is now live — start (or restart) the stability check
    // that eventually clears the failure streak. This runs on the very
    // first mount too, which is harmless (the streak starts at 0 anyway).
    recoveryRef.current?.handleContextCreated();
  }, []);

  return (
    <Canvas
      key={canvasGeneration}
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
