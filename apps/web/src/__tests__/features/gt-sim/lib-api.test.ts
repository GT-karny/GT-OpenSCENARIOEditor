import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GtSimApiClient } from '@osce/esmini';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import {
  useGtSimApi,
  getGtSimApi,
  useGtSimWsBaseUrl,
  getGtSimWsBaseUrl,
  wsBaseUrlFromRest,
  resetGtSimApiCacheForTest,
} from '../../../features/gt-sim/lib/api';

describe('gt-sim lib/api', () => {
  beforeEach(() => {
    useGtSimConnectionStore.getState().reset();
    resetGtSimApiCacheForTest();
  });

  const readyStatus = (restBaseUrl: string, wsBaseUrl: string) =>
    useGtSimConnectionStore.getState().applyStatus({
      state: 'ready',
      endpoints: { restBaseUrl, wsBaseUrl, grpcPort: 50051 },
    });

  describe('wsBaseUrlFromRest', () => {
    it('swaps http to ws and trims trailing slashes', () => {
      expect(wsBaseUrlFromRest('http://127.0.0.1:8000/')).toBe('ws://127.0.0.1:8000');
    });

    it('swaps https to wss', () => {
      expect(wsBaseUrlFromRest('https://sim.example.com')).toBe('wss://sim.example.com');
    });
  });

  describe('useGtSimApi', () => {
    it('returns null while disconnected', () => {
      const { result } = renderHook(() => useGtSimApi());
      expect(result.current).toBeNull();
    });

    it('returns a client once endpoints are ready', () => {
      readyStatus('http://127.0.0.1:8000', 'ws://127.0.0.1:8000');
      const { result } = renderHook(() => useGtSimApi());
      expect(result.current).toBeInstanceOf(GtSimApiClient);
    });

    it('follows an endpoint change with a new client and nulls on crash', () => {
      readyStatus('http://127.0.0.1:8000', 'ws://127.0.0.1:8000');
      const { result } = renderHook(() => useGtSimApi());
      const first = result.current;
      expect(first).toBeInstanceOf(GtSimApiClient);

      // Backend restarted on a new port: a fresh client bound to the new URL.
      act(() => readyStatus('http://127.0.0.1:8001', 'ws://127.0.0.1:8001'));
      const second = result.current;
      expect(second).toBeInstanceOf(GtSimApiClient);
      expect(second).not.toBe(first);

      // Same endpoint again on a re-render: instance is stable (cached).
      act(() => readyStatus('http://127.0.0.1:8001', 'ws://127.0.0.1:8001'));
      expect(result.current).toBe(second);

      // Crash clears endpoints: hook goes back to null.
      act(() =>
        useGtSimConnectionStore.getState().applyStatus({ state: 'crashed', message: 'boom' }),
      );
      expect(result.current).toBeNull();
    });
  });

  describe('getGtSimApi', () => {
    it('returns null while disconnected', () => {
      expect(getGtSimApi()).toBeNull();
    });

    it('shares the cached instance with the hook', () => {
      readyStatus('http://127.0.0.1:8000', 'ws://127.0.0.1:8000');
      const { result } = renderHook(() => useGtSimApi());
      expect(getGtSimApi()).toBe(result.current);
    });
  });

  describe('WS base URL accessors', () => {
    it('return null while disconnected', () => {
      const { result } = renderHook(() => useGtSimWsBaseUrl());
      expect(result.current).toBeNull();
      expect(getGtSimWsBaseUrl()).toBeNull();
    });

    it('return the resolved wsBaseUrl and follow endpoint changes', () => {
      readyStatus('http://127.0.0.1:8000', 'ws://127.0.0.1:8000');
      const { result } = renderHook(() => useGtSimWsBaseUrl());
      expect(result.current).toBe('ws://127.0.0.1:8000');
      expect(getGtSimWsBaseUrl()).toBe('ws://127.0.0.1:8000');

      act(() => readyStatus('http://127.0.0.1:8001', 'ws://127.0.0.1:8001'));
      expect(result.current).toBe('ws://127.0.0.1:8001');
    });

    it('fall back to deriving from restBaseUrl when wsBaseUrl is empty', () => {
      readyStatus('https://sim.example.com', '');
      expect(getGtSimWsBaseUrl()).toBe('wss://sim.example.com');
    });
  });
});
