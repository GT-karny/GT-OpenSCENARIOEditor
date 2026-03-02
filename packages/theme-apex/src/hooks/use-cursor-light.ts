import { useEffect, useRef, useCallback } from 'react';

/** Wide light detection range (px) — surface reflection falloff */
const WIDE_MAX = 340;
/** Hot light detection range (px) — edge specular falloff */
const HOT_MAX = 225;

/**
 * Global cursor light system for APEX design identity.
 *
 * Updates CSS custom properties on :root (--mx, --my) for the ambient
 * cursor light overlay, and per-element properties (--local-x, --local-y,
 * --light-intensity, --hot-intensity) for glass panel reflections.
 *
 * Must be called once at the app root level.
 */
export function useCursorLight() {
  const mx = useRef(0);
  const my = useRef(0);
  const raf = useRef<number | null>(null);

  const update = useCallback(() => {
    const root = document.documentElement;
    root.style.setProperty('--mx', mx.current + 'px');
    root.style.setProperty('--my', my.current + 'px');

    // Find all glass elements that react to cursor light
    const elements = document.querySelectorAll<HTMLElement>('.glass, .glass-item');

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();

      // Distance from cursor to nearest point on the element's bounding rect.
      // When cursor is inside the panel, dist = 0 (full intensity).
      // When outside, dist = distance to the closest edge.
      const nearestX = Math.max(rect.left, Math.min(mx.current, rect.right));
      const nearestY = Math.max(rect.top, Math.min(my.current, rect.bottom));
      const dx = mx.current - nearestX;
      const dy = my.current - nearestY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Wide light — surface reflection
      const intensity = Math.max(0, 1 - dist / WIDE_MAX);

      // Hot light — edge specular only
      const hotIntensity = Math.max(0, 1 - dist / HOT_MAX);

      // Local cursor position relative to element
      const localX = ((mx.current - rect.left) / rect.width) * 100;
      const localY = ((my.current - rect.top) / rect.height) * 100;

      el.style.setProperty('--local-x', localX + '%');
      el.style.setProperty('--local-y', localY + '%');
      el.style.setProperty('--light-intensity', intensity.toFixed(3));
      el.style.setProperty('--hot-intensity', hotIntensity.toFixed(3));
    });

    raf.current = null;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mx.current = e.clientX;
      my.current = e.clientY;
      if (raf.current === null) {
        raf.current = requestAnimationFrame(update);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
      }
    };
  }, [update]);
}
