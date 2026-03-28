/**
 * Canvas-based 2D signal icon that reflects the current bulb state.
 * Used in the Intersection Timeline panel left column.
 *
 * When the state contains "flashing" bulbs, the icon blinks on/off at 500ms intervals.
 */

import { useRef, useEffect, memo } from 'react';
import type { SignalDescriptor } from '@osce/3d-viewer';
import { hasFlashingBulb } from '@osce/3d-viewer';
import { renderSignalToCanvas } from '../../../lib/signal-icon-renderer';

interface SignalIcon2DProps {
  descriptor: SignalDescriptor;
  activeState: string;
  width?: number;
  height?: number;
}

/**
 * Replace "flashing" tokens with "off" in a state string
 * to produce the "blink off" frame.
 */
function flashingToOff(state: string): string {
  return state
    .split(';')
    .map((s) => (s.trim().toLowerCase() === 'flashing' ? 'off' : s))
    .join(';');
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

    const draw = (state: string) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderSignalToCanvas(ctx, descriptor, state, width, height);
    };

    const isFlashing = hasFlashingBulb(activeState);

    // Initial draw (always show the "on" frame first)
    draw(activeState);

    if (!isFlashing) return;

    // Blink: alternate between activeState and flashing→off every 500ms
    let showOn = true;
    const offState = flashingToOff(activeState);

    const interval = setInterval(() => {
      showOn = !showOn;
      draw(showOn ? activeState : offState);
    }, 500);

    return () => clearInterval(interval);
  }, [descriptor, activeState, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="shrink-0"
    />
  );
});
