/**
 * Unit tests for signal-icon-renderer (descriptor-based Canvas2D renderer).
 *
 * Canvas is not available in JSDOM — we mock CanvasRenderingContext2D.
 * Tests cover bulb mode parsing, rendering dispatch, and BULB_SPACING unification.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBulbMode, renderSignalToCanvas } from '../../signal/signal-icon-renderer.js';
import { BULB_SPACING } from '../../signal/signal-render-constants.js';
import type { SignalDescriptor } from '../../signal/signal-preset-types.js';

// ---------------------------------------------------------------------------
// getBulbMode
// ---------------------------------------------------------------------------

describe('getBulbMode', () => {
  it('parses positional "on" for index 0', () => {
    expect(getBulbMode('on;off;off', 0, 'red')).toBe('on');
  });

  it('parses positional "off" for index 1', () => {
    expect(getBulbMode('on;off;off', 1, 'yellow')).toBe('off');
  });

  it('parses positional "flashing"', () => {
    expect(getBulbMode('flashing;off;off', 0, 'red')).toBe('flashing');
  });

  it('handles color name format "red" → on for red bulb at index 0', () => {
    expect(getBulbMode('red', 0, 'red')).toBe('on');
  });

  it('handles color name format "red" → off for green bulb', () => {
    expect(getBulbMode('red', 0, 'green')).toBe('off');
  });

  it('handles single "on" token → on for index 0 only', () => {
    expect(getBulbMode('on', 0, 'red')).toBe('on');
    expect(getBulbMode('on', 1, 'yellow')).toBe('off');
  });

  it('handles out-of-bounds index gracefully', () => {
    expect(getBulbMode('on;off', 5, 'green')).toBe('off');
  });
});

// ---------------------------------------------------------------------------
// BULB_SPACING unified with engine value
// ---------------------------------------------------------------------------

describe('BULB_SPACING', () => {
  it('is 0.38 (unified with opendrive-engine)', () => {
    expect(BULB_SPACING).toBe(0.38);
  });
});

// ---------------------------------------------------------------------------
// renderSignalToCanvas — smoke test with mocked context
// ---------------------------------------------------------------------------

function makeMockCtx(): CanvasRenderingContext2D {
  return {
    clearRect: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    quadraticCurveTo: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    setTransform: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

const THREE_LIGHT_DESCRIPTOR: SignalDescriptor = {
  label: '3-Light Vertical',
  bulbs: [
    { color: 'red', shape: 'circle' },
    { color: 'yellow', shape: 'circle' },
    { color: 'green', shape: 'circle' },
  ],
  housing: { width: 0.4, depth: 0.12, height: 1.1 },
  bulbRadius: 0.12,
  orientation: 'vertical',
};

describe('renderSignalToCanvas', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = makeMockCtx();
  });

  it('calls clearRect to reset the canvas', () => {
    renderSignalToCanvas(ctx, THREE_LIGHT_DESCRIPTOR, 'on;off;off', 24, 56);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 24, 56);
  });

  it('calls fill at least once (housing background)', () => {
    renderSignalToCanvas(ctx, THREE_LIGHT_DESCRIPTOR, 'off;off;off', 24, 56);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('draws an arc for each bulb', () => {
    renderSignalToCanvas(ctx, THREE_LIGHT_DESCRIPTOR, 'on;off;off', 24, 56);
    // At minimum one arc per bulb; active glow adds more
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('renders flashing bulb with hatching (stroke calls)', () => {
    renderSignalToCanvas(ctx, THREE_LIGHT_DESCRIPTOR, 'flashing;off;off', 24, 56);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('handles horizontal orientation without throwing', () => {
    const hDesc: SignalDescriptor = { ...THREE_LIGHT_DESCRIPTOR, orientation: 'horizontal' };
    expect(() => renderSignalToCanvas(ctx, hDesc, 'on;off;off', 56, 24)).not.toThrow();
  });

  it('renders arrow-turn-left shape (quadratic curve path) without throwing', () => {
    const arrowDesc: SignalDescriptor = {
      label: 'Turn Left',
      bulbs: [{ color: 'green', shape: 'arrow-turn-left' }],
      housing: { width: 0.4, depth: 0.12, height: 0.4 },
      bulbRadius: 0.12,
      orientation: 'vertical',
    };
    expect(() => renderSignalToCanvas(ctx, arrowDesc, 'on', 24, 24)).not.toThrow();
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
  });

  it('renders arrow-uturn shape (quadratic curve path) without throwing', () => {
    const arrowDesc: SignalDescriptor = {
      label: 'U-Turn',
      bulbs: [{ color: 'green', shape: 'arrow-uturn' }],
      housing: { width: 0.4, depth: 0.12, height: 0.4 },
      bulbRadius: 0.12,
      orientation: 'vertical',
    };
    expect(() => renderSignalToCanvas(ctx, arrowDesc, 'on', 24, 24)).not.toThrow();
  });

  it('renders pedestrian-stop shape including head circle', () => {
    const pedDesc: SignalDescriptor = {
      label: 'Ped Stop',
      bulbs: [{ color: 'red', shape: 'pedestrian-stop' }],
      housing: { width: 0.4, depth: 0.12, height: 0.4 },
      bulbRadius: 0.12,
      orientation: 'vertical',
    };
    renderSignalToCanvas(ctx, pedDesc, 'on', 24, 24);
    // arc is called for: glow, bulb circle, pedestrian head
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
