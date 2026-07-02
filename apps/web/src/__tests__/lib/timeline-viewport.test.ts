import { describe, it, expect } from 'vitest';
import {
  fullViewport,
  clamp,
  timeToFraction,
  fractionToTime,
  zoomViewport,
  panViewport,
  MIN_VIEWPORT_SPAN,
  MAX_ZOOM,
  type TimelineViewport,
} from '../../lib/timeline-viewport';

describe('timeline-viewport: basics', () => {
  it('fullViewport spans 0..totalTime', () => {
    expect(fullViewport(10)).toEqual({ start: 0, end: 10 });
  });

  it('fullViewport enforces a minimum span for zero-length timelines', () => {
    expect(fullViewport(0)).toEqual({ start: 0, end: MIN_VIEWPORT_SPAN });
  });

  it('clamp bounds values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('timeline-viewport: time <-> fraction round-trip', () => {
  it('round-trips at full zoom', () => {
    const vp = fullViewport(10);
    for (const t of [0, 2.5, 5, 7.3, 10]) {
      const frac = timeToFraction(t, vp);
      expect(fractionToTime(frac, vp)).toBeCloseTo(t, 10);
    }
  });

  it('round-trips at a zoomed-in viewport', () => {
    const vp: TimelineViewport = { start: 3, end: 5 };
    for (const t of [3, 3.5, 4, 4.9, 5]) {
      const frac = timeToFraction(t, vp);
      expect(fractionToTime(frac, vp)).toBeCloseTo(t, 10);
    }
  });

  it('maps viewport edges to 0 and 1', () => {
    const vp: TimelineViewport = { start: 2, end: 8 };
    expect(timeToFraction(2, vp)).toBeCloseTo(0, 10);
    expect(timeToFraction(8, vp)).toBeCloseTo(1, 10);
    expect(timeToFraction(5, vp)).toBeCloseTo(0.5, 10);
  });

  it('fraction round-trips through time (frac -> time -> frac)', () => {
    const vp: TimelineViewport = { start: 1, end: 9 };
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      const t = fractionToTime(f, vp);
      expect(timeToFraction(t, vp)).toBeCloseTo(f, 10);
    }
  });

  it('degenerate span yields fraction 0 without dividing by zero', () => {
    const vp: TimelineViewport = { start: 4, end: 4 };
    expect(timeToFraction(4, vp)).toBe(0);
  });
});

describe('timeline-viewport: zoom', () => {
  it('zooming in narrows the span and keeps focus time fixed under the cursor', () => {
    const vp = fullViewport(10);
    const focus = 0.5; // center
    const focusTimeBefore = fractionToTime(focus, vp);
    const zoomed = zoomViewport(vp, focus, 1, 10);
    expect(zoomed.end - zoomed.start).toBeLessThan(vp.end - vp.start);
    // Focus time still sits at the same fraction of the new viewport.
    expect(fractionToTime(focus, zoomed)).toBeCloseTo(focusTimeBefore, 6);
  });

  it('zooming out widens the span', () => {
    const vp: TimelineViewport = { start: 4, end: 6 };
    const zoomed = zoomViewport(vp, 0.5, -1, 10);
    expect(zoomed.end - zoomed.start).toBeGreaterThan(vp.end - vp.start);
  });

  it('never zooms out past the full timeline', () => {
    const vp = fullViewport(10);
    const zoomed = zoomViewport(vp, 0.5, -100, 10);
    expect(zoomed.start).toBeGreaterThanOrEqual(0);
    expect(zoomed.end).toBeLessThanOrEqual(10 + 1e-9);
    expect(zoomed.end - zoomed.start).toBeCloseTo(10, 6);
  });

  it('never zooms in below the max-zoom span', () => {
    const vp = fullViewport(10);
    const zoomed = zoomViewport(vp, 0.5, 100, 10);
    const minSpan = 10 / MAX_ZOOM;
    expect(zoomed.end - zoomed.start).toBeGreaterThanOrEqual(minSpan - 1e-9);
  });

  it('re-anchors to the left edge when zooming out near the start', () => {
    const vp: TimelineViewport = { start: 0, end: 2 };
    const zoomed = zoomViewport(vp, 0, -1, 10);
    expect(zoomed.start).toBe(0);
  });

  it('re-anchors to the right edge when zooming out near the end', () => {
    const vp: TimelineViewport = { start: 8, end: 10 };
    const zoomed = zoomViewport(vp, 1, -1, 10);
    expect(zoomed.end).toBeCloseTo(10, 6);
  });

  it('zoom in then zoom out around the same cursor round-trips the span', () => {
    const vp = fullViewport(10);
    const zoomedIn = zoomViewport(vp, 0.5, 1, 10);
    const back = zoomViewport(zoomedIn, 0.5, -1, 10);
    expect(back.start).toBeCloseTo(vp.start, 6);
    expect(back.end).toBeCloseTo(vp.end, 6);
  });
});

describe('timeline-viewport: pan', () => {
  it('pans right by a fraction of the span', () => {
    const vp: TimelineViewport = { start: 2, end: 4 };
    const panned = panViewport(vp, 0.5, 10); // +1s (0.5 * 2s span)
    expect(panned.start).toBeCloseTo(3, 6);
    expect(panned.end).toBeCloseTo(5, 6);
  });

  it('clamps pan at the right edge', () => {
    const vp: TimelineViewport = { start: 8, end: 10 };
    const panned = panViewport(vp, 1, 10);
    expect(panned.end).toBeCloseTo(10, 6);
    expect(panned.start).toBeCloseTo(8, 6);
  });

  it('clamps pan at the left edge', () => {
    const vp: TimelineViewport = { start: 0, end: 2 };
    const panned = panViewport(vp, -1, 10);
    expect(panned.start).toBe(0);
    expect(panned.end).toBeCloseTo(2, 6);
  });
});
