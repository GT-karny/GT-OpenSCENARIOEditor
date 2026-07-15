import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';

describe('gt-sim-connection-store', () => {
  beforeEach(() => {
    useGtSimConnectionStore.getState().reset();
  });

  const endpoints = {
    restBaseUrl: 'http://127.0.0.1:8000',
    wsBaseUrl: 'ws://127.0.0.1:8000',
    grpcPort: 50051,
  };

  it('primeEndpoints applies ready only while no status push has been received', () => {
    // No push yet: the one-shot getEndpoints priming is trusted.
    useGtSimConnectionStore.getState().primeEndpoints(endpoints);
    expect(useGtSimConnectionStore.getState().state).toBe('ready');
    expect(useGtSimConnectionStore.getState().endpoints).toEqual(endpoints);
  });

  it('a stale getEndpoints response cannot resurrect ready after a crashed push', () => {
    // Push arrives first (authoritative)…
    useGtSimConnectionStore.getState().applyStatus({ state: 'crashed', message: 'boom' });
    // …then an in-flight invoke resolves with the old endpoints: must be ignored.
    useGtSimConnectionStore.getState().primeEndpoints(endpoints);
    const s = useGtSimConnectionStore.getState();
    expect(s.state).toBe('crashed');
    expect(s.endpoints).toBeNull();
    expect(s.message).toBe('boom');
  });

  it('applies a ready status with endpoints', () => {
    useGtSimConnectionStore.getState().applyStatus({
      state: 'ready',
      endpoints: {
        restBaseUrl: 'http://127.0.0.1:8000',
        wsBaseUrl: 'ws://127.0.0.1:8000',
        grpcPort: 50051,
      },
      pid: 4321,
    });
    const s = useGtSimConnectionStore.getState();
    expect(s.state).toBe('ready');
    expect(s.endpoints?.restBaseUrl).toBe('http://127.0.0.1:8000');
    expect(s.pid).toBe(4321);
  });

  it('clears endpoints and keeps the message on crash', () => {
    useGtSimConnectionStore
      .getState()
      .applyStatus({ state: 'crashed', message: 'exit code 1' });
    const s = useGtSimConnectionStore.getState();
    expect(s.state).toBe('crashed');
    expect(s.endpoints).toBeNull();
    expect(s.message).toBe('exit code 1');
  });

  it('derives a ws base URL from a manual REST url (dev fallback)', () => {
    useGtSimConnectionStore.getState().setManualEndpoints('http://localhost:9000/');
    const s = useGtSimConnectionStore.getState();
    expect(s.state).toBe('ready');
    expect(s.endpoints).toEqual({
      restBaseUrl: 'http://localhost:9000',
      wsBaseUrl: 'ws://localhost:9000',
      grpcPort: 0,
    });
  });

  it('uses wss for an https manual REST url', () => {
    useGtSimConnectionStore.getState().setManualEndpoints('https://sim.example.com');
    expect(useGtSimConnectionStore.getState().endpoints?.wsBaseUrl).toBe(
      'wss://sim.example.com',
    );
  });

  describe('requestConnect', () => {
    afterEach(() => {
      delete (window as unknown as { electronAPI?: unknown }).electronAPI;
    });

    it('rejects when no Electron bridge is present (browser dev)', async () => {
      delete (window as unknown as { electronAPI?: unknown }).electronAPI;
      await expect(
        useGtSimConnectionStore.getState().requestConnect({ host: '127.0.0.1', port: 8000 }),
      ).rejects.toThrow(/bridge unavailable/i);
    });

    it('delegates to window.electronAPI.gtSimConnect with the given config', async () => {
      const gtSimConnect = vi.fn().mockResolvedValue({
        restBaseUrl: 'http://127.0.0.1:8000',
        wsBaseUrl: 'ws://127.0.0.1:8000',
        grpcPort: 50051,
      });
      (window as unknown as { electronAPI: unknown }).electronAPI = { gtSimConnect };

      await useGtSimConnectionStore.getState().requestConnect({ host: '10.0.0.5', port: 9001 });

      expect(gtSimConnect).toHaveBeenCalledWith({ host: '10.0.0.5', port: 9001 });
    });

    it('propagates a rejection from gtSimConnect', async () => {
      const gtSimConnect = vi.fn().mockRejectedValue(new Error('unreachable'));
      (window as unknown as { electronAPI: unknown }).electronAPI = { gtSimConnect };

      await expect(
        useGtSimConnectionStore.getState().requestConnect({ port: 8000 }),
      ).rejects.toThrow('unreachable');
    });
  });
});
