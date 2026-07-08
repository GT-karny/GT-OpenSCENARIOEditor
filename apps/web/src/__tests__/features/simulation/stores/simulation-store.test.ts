import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SimulationFrame, SimulationResult, StoryBoardEvent } from '@osce/shared';
import { useSimulationStore } from '../../../../features/simulation/stores/simulation-store';

/** Build a frame list with evenly spaced timestamps and a moving lead object. */
function makeFrames(count: number, dt = 0.1): SimulationFrame[] {
  return Array.from({ length: count }, (_, i) => ({
    time: Number((i * dt).toFixed(4)),
    objects: [
      {
        id: 0,
        name: 'Ego',
        x: i, // moves 1m per frame so position is observable
        y: 0,
        z: 0,
        h: 0,
        p: 0,
        r: 0,
        speed: 10,
      },
    ],
  }));
}

function completed(frames: SimulationFrame[]): SimulationResult {
  return {
    status: 'completed',
    frames,
    duration: frames.length > 0 ? frames[frames.length - 1].time : 0,
  };
}

describe('simulation-store', () => {
  beforeEach(() => {
    useSimulationStore.getState().reset();
  });

  afterEach(() => {
    useSimulationStore.getState().reset();
    vi.restoreAllMocks();
  });

  describe('completion state transitions', () => {
    it('starts idle and becomes completed with frames on setCompleted', () => {
      expect(useSimulationStore.getState().status).toBe('idle');
      const frames = makeFrames(20);
      useSimulationStore.getState().setCompleted(completed(frames));

      const s = useSimulationStore.getState();
      expect(s.status).toBe('completed');
      expect(s.frames).toHaveLength(20);
      expect(s.currentFrameIndex).toBe(0);
      expect(s.isPlaying).toBe(false);
    });

    it('setError moves to error state and stops playback', () => {
      useSimulationStore.getState().setCompleted(completed(makeFrames(10)));
      useSimulationStore.getState().play();
      useSimulationStore.getState().setError('boom');

      const s = useSimulationStore.getState();
      expect(s.status).toBe('error');
      expect(s.error).toBe('boom');
      expect(s.isPlaying).toBe(false);
    });

    it('reset returns the store to its initial state', () => {
      useSimulationStore.getState().setCompleted(completed(makeFrames(5)));
      useSimulationStore.getState().setSpeed(4);
      useSimulationStore.getState().reset();

      const s = useSimulationStore.getState();
      expect(s.status).toBe('idle');
      expect(s.frames).toEqual([]);
      expect(s.currentFrameIndex).toBe(0);
      expect(s.playbackSpeed).toBe(1);
      expect(s.isPlaying).toBe(false);
      expect(s.error).toBeUndefined();
    });
  });

  describe('seek', () => {
    beforeEach(() => {
      useSimulationStore.getState().setCompleted(completed(makeFrames(10)));
    });

    it('seeks to an exact frame index', () => {
      useSimulationStore.getState().seekTo(4);
      expect(useSimulationStore.getState().currentFrameIndex).toBe(4);
    });

    it('clamps a negative index to 0', () => {
      useSimulationStore.getState().seekTo(-5);
      expect(useSimulationStore.getState().currentFrameIndex).toBe(0);
    });

    it('clamps an over-large index to the last frame', () => {
      useSimulationStore.getState().seekTo(999);
      expect(useSimulationStore.getState().currentFrameIndex).toBe(9);
    });
  });

  describe('speed', () => {
    it('updates playbackSpeed', () => {
      useSimulationStore.getState().setSpeed(2);
      expect(useSimulationStore.getState().playbackSpeed).toBe(2);
      useSimulationStore.getState().setSpeed(0.5);
      expect(useSimulationStore.getState().playbackSpeed).toBe(0.5);
    });
  });

  describe('play / pause with a controllable rAF', () => {
    let rafCallbacks: FrameRequestCallback[] = [];

    beforeEach(() => {
      rafCallbacks = [];
      vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });
      vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    });

    /** Drive the rAF loop forward by one tick at the given timestamp. */
    function tick(ts: number) {
      const cbs = rafCallbacks;
      rafCallbacks = [];
      for (const cb of cbs) cb(ts);
    }

    it('play sets isPlaying and advances the frame index over time', () => {
      // 0.1s per frame, 20 frames -> 1.9s total.
      useSimulationStore.getState().setCompleted(completed(makeFrames(20, 0.1)));
      useSimulationStore.getState().play();
      expect(useSimulationStore.getState().isPlaying).toBe(true);

      // First tick establishes the baseline timestamp (no advance yet).
      tick(0);
      // 500ms later at speed 1 -> playbackTime ~0.5s -> frame index ~5.
      tick(500);
      const idx = useSimulationStore.getState().currentFrameIndex;
      expect(idx).toBeGreaterThanOrEqual(4);
      expect(idx).toBeLessThanOrEqual(6);
    });

    it('pause stops advancing the frame index', () => {
      useSimulationStore.getState().setCompleted(completed(makeFrames(20, 0.1)));
      useSimulationStore.getState().play();
      tick(0);
      tick(300);
      const frozen = useSimulationStore.getState().currentFrameIndex;
      useSimulationStore.getState().pause();
      expect(useSimulationStore.getState().isPlaying).toBe(false);

      // Further ticks must not advance once paused.
      tick(600);
      tick(900);
      expect(useSimulationStore.getState().currentFrameIndex).toBe(frozen);
    });

    it('higher speed advances frames faster', () => {
      useSimulationStore.getState().setCompleted(completed(makeFrames(40, 0.1)));
      useSimulationStore.getState().setSpeed(4);
      useSimulationStore.getState().play();
      tick(0);
      tick(250); // 0.25s real * 4x = 1.0s sim -> ~frame 10
      const idx = useSimulationStore.getState().currentFrameIndex;
      expect(idx).toBeGreaterThanOrEqual(8);
    });

    it('playing to the end stops and pins to the last frame', () => {
      useSimulationStore.getState().setCompleted(completed(makeFrames(10, 0.1)));
      useSimulationStore.getState().play();
      tick(0);
      tick(5000); // well past the 0.9s total
      const s = useSimulationStore.getState();
      expect(s.currentFrameIndex).toBe(9);
      expect(s.isPlaying).toBe(false);
    });

    it('play() from the end restarts from the beginning', () => {
      useSimulationStore.getState().setCompleted(completed(makeFrames(10, 0.1)));
      useSimulationStore.getState().seekTo(9); // at the end
      useSimulationStore.getState().play();
      expect(useSimulationStore.getState().currentFrameIndex).toBe(0);
      expect(useSimulationStore.getState().isPlaying).toBe(true);
    });

    it('play() is a no-op when there are no frames', () => {
      useSimulationStore.getState().play();
      expect(useSimulationStore.getState().isPlaying).toBe(false);
    });
  });

  describe('active-element computation (binary search over sorted events)', () => {
    const events: StoryBoardEvent[] = [
      { name: 'A', elementType: 'event', state: 'running', fullPath: 'S::A', timestamp: 1.0 },
      { name: 'A', elementType: 'event', state: 'complete', fullPath: 'S::A', timestamp: 2.0 },
      { name: 'B', elementType: 'event', state: 'running', fullPath: 'S::B', timestamp: 1.5 },
    ];

    beforeEach(() => {
      // 30 frames at 0.1s -> times 0.0 .. 2.9
      useSimulationStore.getState().setCompleted(completed(makeFrames(30, 0.1)));
      useSimulationStore.getState().setStoryBoardEvents(events);
    });

    it('sorts events by timestamp on ingest', () => {
      const ts = useSimulationStore.getState().storyBoardEvents.map((e) => e.timestamp);
      expect(ts).toEqual([...ts].sort((a, b) => a - b));
    });

    it('no elements active before any event fires', () => {
      useSimulationStore.getState().seekTo(0); // t = 0.0
      expect(useSimulationStore.getState().activeElements).toEqual([]);
    });

    it('A and B both running between t=1.5 and t=2.0', () => {
      useSimulationStore.getState().seekTo(17); // t = 1.7
      const active = useSimulationStore.getState().activeElements;
      expect(active).toContain('S::A');
      expect(active).toContain('S::B');
    });

    it('A completes by t=2.0, leaving only B running', () => {
      useSimulationStore.getState().seekTo(25); // t = 2.5
      const active = useSimulationStore.getState().activeElements;
      expect(active).not.toContain('S::A');
      expect(active).toContain('S::B');
    });
  });
});
