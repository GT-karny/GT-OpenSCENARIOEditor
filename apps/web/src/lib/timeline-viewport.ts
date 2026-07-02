/**
 * Viewport math for the simulation timeline.
 *
 * The timeline draws a window `[start, end]` of simulation time across a pixel
 * width. Zooming shrinks/grows that window; panning slides it. Every pixel
 * position on the track (slider thumb, event markers, draggable event blocks)
 * maps through the same `timeToFraction` / `fractionToTime` pair so they stay
 * pixel-aligned at any zoom level.
 *
 * State is intentionally plain data (no store) — B4 keeps the viewport local to
 * the timeline component tree.
 */

/** Minimum visible span, in seconds, so zoom never collapses to zero width. */
export const MIN_VIEWPORT_SPAN = 0.1;

/** Maximum zoom factor relative to the full timeline (1 = fully zoomed out). */
export const MAX_ZOOM = 200;

/** A visible window of simulation time. */
export interface TimelineViewport {
  /** Left edge, in seconds. */
  start: number;
  /** Right edge, in seconds. */
  end: number;
}

/** The fully-zoomed-out viewport spanning the whole timeline. */
export function fullViewport(totalTime: number): TimelineViewport {
  return { start: 0, end: Math.max(totalTime, MIN_VIEWPORT_SPAN) };
}

/** Clamp a value into `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Map a simulation time to a fraction `[0, 1]` of the current viewport width.
 * Times outside the viewport map outside `[0, 1]` (callers clamp as needed).
 */
export function timeToFraction(time: number, viewport: TimelineViewport): number {
  const span = viewport.end - viewport.start;
  if (span <= 0) return 0;
  return (time - viewport.start) / span;
}

/** Inverse of {@link timeToFraction}: map a viewport fraction back to seconds. */
export function fractionToTime(fraction: number, viewport: TimelineViewport): number {
  const span = viewport.end - viewport.start;
  return viewport.start + fraction * span;
}

/**
 * Zoom the viewport around a focus fraction (e.g. the cursor position, 0..1).
 *
 * `zoomDelta > 0` zooms in (narrower window), `< 0` zooms out. The time under
 * `focusFraction` stays fixed under the cursor. The result is clamped so it
 * never exceeds `[0, totalTime]` nor shrinks below {@link MIN_VIEWPORT_SPAN},
 * and it is re-anchored to the edges when a zoom-out would spill past them.
 */
export function zoomViewport(
  viewport: TimelineViewport,
  focusFraction: number,
  zoomDelta: number,
  totalTime: number,
): TimelineViewport {
  const total = Math.max(totalTime, MIN_VIEWPORT_SPAN);
  const currentSpan = viewport.end - viewport.start;
  const focusTime = fractionToTime(clamp(focusFraction, 0, 1), viewport);

  // Exponential zoom feels natural for wheel input.
  const scale = Math.exp(-zoomDelta);
  const minSpan = Math.max(total / MAX_ZOOM, MIN_VIEWPORT_SPAN);
  const nextSpan = clamp(currentSpan * scale, minSpan, total);

  // Keep the focus time at the same fraction of the (new) span.
  const focusFrac = clamp(focusFraction, 0, 1);
  let start = focusTime - focusFrac * nextSpan;
  let end = start + nextSpan;

  // Re-anchor if we spilled past either edge.
  if (start < 0) {
    start = 0;
    end = nextSpan;
  }
  if (end > total) {
    end = total;
    start = total - nextSpan;
  }

  return { start: clamp(start, 0, total), end: clamp(end, minSpan, total) };
}

/**
 * Pan the viewport by a fraction of its current width (positive = right/later).
 * Clamped so the window stays within `[0, totalTime]`.
 */
export function panViewport(
  viewport: TimelineViewport,
  deltaFraction: number,
  totalTime: number,
): TimelineViewport {
  const total = Math.max(totalTime, MIN_VIEWPORT_SPAN);
  const span = viewport.end - viewport.start;
  const shift = deltaFraction * span;
  let start = viewport.start + shift;
  start = clamp(start, 0, total - span);
  return { start, end: start + span };
}
