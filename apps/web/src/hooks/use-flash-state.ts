/**
 * Detects running → not-running transitions and provides a "fading" state
 * for flash + afterglow visual effects on instantaneous actions.
 *
 * Returns:
 *  - 'running'  while the element is active
 *  - 'fading'   for fadeDurationMs after the element leaves active state
 *  - 'idle'     otherwise
 */

import { useEffect, useRef, useState } from 'react';

export type FlashState = 'idle' | 'running' | 'fading';

export function useFlashState(running: boolean, fadeDurationMs = 600): FlashState {
  const [fading, setFading] = useState(false);
  const prevRunning = useRef(running);

  useEffect(() => {
    if (prevRunning.current && !running) {
      setFading(true);
      const timer = setTimeout(() => setFading(false), fadeDurationMs);
      prevRunning.current = running;
      return () => clearTimeout(timer);
    }
    prevRunning.current = running;
  }, [running, fadeDurationMs]);

  if (running) return 'running';
  if (fading) return 'fading';
  return 'idle';
}
