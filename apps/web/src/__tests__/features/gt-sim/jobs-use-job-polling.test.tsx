import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import { resetGtSimApiCacheForTest } from '../../../features/gt-sim/lib/api';
import { useJobPolling } from '../../../features/gt-sim/jobs/hooks/useJobPolling';

function mockResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, Wrapper };
}

describe('useJobPolling (jobs cluster)', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let trackedJobStatus: string;

  beforeEach(() => {
    useGtSimConnectionStore.getState().reset();
    resetGtSimApiCacheForTest();
    trackedJobStatus = 'running';
    fetchSpy = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/simulations/j1')) {
        return Promise.resolve(
          mockResponse({
            job_id: 'j1',
            scenario_id: 's1',
            project_id: null,
            status: trackedJobStatus,
            controller_type: 'virtual_driver',
            progress_pct: 50,
            pid: 123,
            exit_code: null,
            output_dir: null,
            started_at: null,
            completed_at: null,
            error_message: null,
            options: {},
          }),
        );
      }
      // Active-job discovery probe: GET /api/simulations?status=running&...
      return Promise.resolve(mockResponse({ jobs: [], total: 0 }));
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays untracked and issues no requests while the backend is disconnected', () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useJobPolling(), { wrapper: Wrapper });

    expect(result.current.runningJobId).toBeNull();
    expect(result.current.isJobActive).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('handleRunning tracks a job and reflects its live status once connected', async () => {
    useGtSimConnectionStore.getState().applyStatus({
      state: 'ready',
      endpoints: {
        restBaseUrl: 'http://127.0.0.1:8000',
        wsBaseUrl: 'ws://127.0.0.1:8000',
        grpcPort: 50051,
      },
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useJobPolling(), { wrapper: Wrapper });

    act(() => {
      result.current.handleRunning('j1');
    });

    expect(result.current.runningJobId).toBe('j1');
    expect(result.current.latestJobId).toBe('j1');

    await waitFor(() => expect(result.current.runningJobStatus?.status).toBe('running'));
    expect(result.current.isJobActive).toBe(true);
  });

  it(
    'auto-clears the tracked job shortly after it turns terminal',
    async () => {
      useGtSimConnectionStore.getState().applyStatus({
        state: 'ready',
        endpoints: {
          restBaseUrl: 'http://127.0.0.1:8000',
          wsBaseUrl: 'ws://127.0.0.1:8000',
          grpcPort: 50051,
        },
      });
      const { Wrapper, queryClient } = makeWrapper();
      const { result } = renderHook(() => useJobPolling(), { wrapper: Wrapper });

      act(() => {
        result.current.handleRunning('j1');
      });
      await waitFor(() => expect(result.current.runningJobStatus?.status).toBe('running'));
      expect(result.current.isJobActive).toBe(true);

      // The job completes; force a refetch (stands in for the query's own
      // refetchInterval, which this test does not wait out in real time).
      trackedJobStatus = 'completed';
      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: ['job', 'j1'] });
      });

      await waitFor(() => expect(result.current.runningJobStatus?.status).toBe('completed'));
      expect(result.current.isJobActive).toBe(false);
      // Not cleared immediately — only after JOB_POLLING_CLEAR_DELAY_MS.
      expect(result.current.runningJobId).toBe('j1');

      await waitFor(() => expect(result.current.runningJobId).toBeNull(), { timeout: 4000 });
    },
    8000,
  );
});
