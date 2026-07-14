/**
 * `useFps` — render/data FPS diagnostics hook for the live scene visualizer.
 *
 * Ported unmodified from the fork's `hooks/useFps.ts` (pure React hook, no
 * `api`/WS dependency, no changes needed).
 */
import { useEffect, useRef, useState } from 'react';

export interface FpsStats {
  /** How often the host component actually commits (re-renders), per second. */
  renderFps: number;
  /** Rate of an external counter (e.g. WS ground_truth frames received), per second. */
  dataFps: number;
}

/**
 * `renderFps` counts host-component commits (a `useEffect` with no deps fires
 * after every commit). `dataFps` measures the delta of an external monotonic
 * counter — pass the cumulative WS frame count to see incoming sim-frame rate
 * independently of how often the component actually paints.
 *
 * Both are sampled on a ~500ms rAF window. Intended for dev overlays; the work
 * is trivial (two ref increments + one rAF loop) so it is cheap to leave wired.
 */
export function useFps(externalCounter?: number): FpsStats {
  const commitsRef = useRef(0);
  const lastExtRef = useRef(externalCounter ?? 0);
  const extAccumRef = useRef(0);
  const [stats, setStats] = useState<FpsStats>({ renderFps: 0, dataFps: 0 });

  // Runs after every commit of the host component → commit counter.
  useEffect(() => {
    commitsRef.current += 1;
    if (externalCounter !== undefined) {
      const delta = externalCounter - lastExtRef.current;
      if (delta > 0) extAccumRef.current += delta;
      lastExtRef.current = externalCounter;
    }
  });

  useEffect(() => {
    let raf = 0;
    let t0 = performance.now();
    let c0 = commitsRef.current;
    let e0 = extAccumRef.current;

    const tick = () => {
      const now = performance.now();
      const dt = now - t0;
      if (dt >= 500) {
        setStats({
          renderFps: Math.round(((commitsRef.current - c0) * 1000) / dt),
          dataFps: Math.round(((extAccumRef.current - e0) * 1000) / dt),
        });
        t0 = now;
        c0 = commitsRef.current;
        e0 = extAccumRef.current;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return stats;
}
