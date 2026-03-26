/**
 * Canvas-based 2D signal icon that reflects the current bulb state.
 * Used in the Intersection Timeline panel left column.
 */

import { useRef, useEffect, memo } from 'react';
import type { SignalDescriptor } from '@osce/3d-viewer';
import { renderSignalToCanvas } from '../../../lib/signal-icon-renderer';

interface SignalIcon2DProps {
  descriptor: SignalDescriptor;
  activeState: string;
  width?: number;
  height?: number;
}

export const SignalIcon2D = memo(function SignalIcon2D({
  descriptor,
  activeState,
  width = 24,
  height = 56,
}: SignalIcon2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    renderSignalToCanvas(ctx, descriptor, activeState, width, height);
  }, [descriptor, activeState, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="shrink-0"
    />
  );
});
