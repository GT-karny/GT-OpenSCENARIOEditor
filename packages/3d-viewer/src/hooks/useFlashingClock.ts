/**
 * A clock hook that toggles a boolean at a fixed interval for flashing signal animation.
 * Uses R3F's useFrame to accumulate time and flip between on/off phases.
 */

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

/** Flashing period in seconds (full cycle = on + off). */
const FLASH_PERIOD = 1.0;
const HALF_PERIOD = FLASH_PERIOD / 2;

/**
 * Returns `true` during the "on" phase and `false` during the "off" phase.
 * Only triggers re-renders when the phase actually changes.
 *
 * @param enabled — pass `false` to skip the timer (always returns `true`).
 */
export function useFlashingClock(enabled: boolean): boolean {
  const [flashOn, setFlashOn] = useState(true);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!enabled) return;
    elapsed.current += delta;
    if (elapsed.current >= HALF_PERIOD) {
      elapsed.current -= HALF_PERIOD;
      setFlashOn((prev) => !prev);
    }
  });

  return enabled ? flashOn : true;
}
