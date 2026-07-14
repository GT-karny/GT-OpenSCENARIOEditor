import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import { useOsiStream } from '../../../features/gt-sim/live/hooks/useOsiStream';
import { useSvStream } from '../../../features/gt-sim/live/hooks/useSvStream';

/** Minimal fake WebSocket matching `@osce/esmini`'s `WsLike` structural type. */
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(): void {}

  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }

  open(): void {
    this.readyState = 1;
    this.onopen?.();
  }

  message(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

function lastWs(): FakeWebSocket {
  const ws = FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
  if (!ws) throw new Error('no FakeWebSocket instance created');
  return ws;
}

describe('gt-sim live streaming hooks', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    // rAF fires its callback synchronously so GroundTruth coalescing flushes
    // within the same `act()` as the incoming message.
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

    useGtSimConnectionStore.getState().applyStatus({
      state: 'ready',
      endpoints: { restBaseUrl: 'http://127.0.0.1:8000', wsBaseUrl: 'ws://127.0.0.1:8000', grpcPort: 50051 },
    });
  });

  afterEach(() => {
    // RTL auto-cleanup is off in this repo (no vitest globals). Unmount every
    // rendered hook FIRST — while the WebSocket/rAF mocks are still installed —
    // so effect cleanups run (client.dispose(), cancelAnimationFrame) and no
    // React root is left with scheduler work that would fire after jsdom
    // teardown (`ReferenceError: window is not defined`).
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    useGtSimConnectionStore.getState().reset();
  });

  describe('useOsiStream', () => {
    it('is disconnected with no jobId (no socket opened)', () => {
      const { result } = renderHook(() => useOsiStream(null));
      expect(result.current.status).toBe('disconnected');
      expect(FakeWebSocket.instances).toHaveLength(0);
    });

    it('connects to /ws/osi/{jobId} on the injected host', () => {
      renderHook(() => useOsiStream('job1'));
      expect(lastWs().url).toBe('ws://127.0.0.1:8000/ws/osi/job1');
    });

    it('tracks connection state and applies a ground_truth frame', () => {
      const { result } = renderHook(() => useOsiStream('job1'));

      act(() => lastWs().open());
      expect(result.current.status).toBe('connected');

      act(() =>
        lastWs().message({
          type: 'ground_truth',
          sim_time: 1.5,
          objects: [{ id: 1, name: 'ego', x: 1, y: 2, z: 0, h: 0, speed: 3 }],
          traffic_lights: [{ id: 9, x: 0, y: 0, z: 0, h: 0, color: 'green', mode: 'constant', icon: 0 }],
        }),
      );

      expect(result.current.simTime).toBe(1.5);
      expect(result.current.objects).toHaveLength(1);
      expect(result.current.frameCount).toBe(1);
      expect(result.current.trafficLights).toHaveLength(1);
    });

    it('applies a host_vehicle_data frame', () => {
      const { result } = renderHook(() => useOsiStream('job1'));
      act(() => lastWs().open());

      act(() =>
        lastWs().message({
          type: 'host_vehicle_data',
          sim_time: 2,
          throttle: 0.5,
          brake: 0,
          steering_angle: 0.1,
          gear: 3,
          rpm: 2000,
          torque: 100,
          speed: 10,
        }),
      );

      expect(result.current.hvdData).toEqual({
        sim_time: 2,
        throttle: 0.5,
        brake: 0,
        steering_angle: 0.1,
        gear: 3,
        rpm: 2000,
        torque: 100,
        speed: 10,
      });
    });

    it('resets accumulated state when the jobId changes', () => {
      const { result, rerender } = renderHook(({ jobId }) => useOsiStream(jobId), {
        initialProps: { jobId: 'job1' as string | null },
      });
      act(() => lastWs().open());
      act(() => lastWs().message({ type: 'ground_truth', sim_time: 1, objects: [{ id: 1 }] }));
      expect(result.current.objects).toHaveLength(1);

      rerender({ jobId: 'job2' });
      expect(result.current.objects).toHaveLength(0);
      expect(result.current.simTime).toBe(0);
      expect(lastWs().url).toBe('ws://127.0.0.1:8000/ws/osi/job2');
    });
  });

  describe('useSvStream', () => {
    it('connects to /ws/sv/{jobId} and applies a scenario_variables snapshot', () => {
      const { result } = renderHook(() => useSvStream('job1'));
      expect(lastWs().url).toBe('ws://127.0.0.1:8000/ws/sv/job1');

      act(() => lastWs().open());
      expect(result.current.status).toBe('connected');

      act(() => lastWs().message({ type: 'scenario_variables', variables: { a: 1, b: true }, sim_time: 3 }));
      expect(result.current.variables).toEqual({ a: 1, b: true });
      expect(result.current.simTime).toBe(3);
    });
  });
});
