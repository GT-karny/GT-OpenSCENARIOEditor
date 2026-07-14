import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import { resetGtSimApiCacheForTest } from '../../../features/gt-sim/lib/api';
import { useProjectStore } from '../../../stores/project-store';
import { useProjectsRootSync } from '../../../features/gt-sim/settings/hooks/use-projects-root-sync';

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
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, Wrapper };
}

function connectGtSim() {
  useGtSimConnectionStore.getState().applyStatus({
    state: 'ready',
    endpoints: {
      restBaseUrl: 'http://127.0.0.1:8000',
      wsBaseUrl: 'ws://127.0.0.1:8000',
      grpcPort: 50051,
    },
  });
}

describe('useProjectsRootSync (settings cluster, design judgment D4)', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let putCalls: Array<{ url: string; body: unknown }>;

  beforeEach(() => {
    useGtSimConnectionStore.getState().reset();
    resetGtSimApiCacheForTest();
    useProjectStore.setState({ projectsRoot: null });
    putCalls = [];
    fetchSpy = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/config/projects-root') && init?.method === 'PUT') {
        const body = init.body ? JSON.parse(String(init.body)) : undefined;
        putCalls.push({ url, body });
        return Promise.resolve(
          mockResponse({
            projects_root: body?.projects_root ?? null,
            effective_dir: body?.projects_root ?? '/default',
          }),
        );
      }
      return Promise.resolve(mockResponse({}));
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    // This suite mutates shared singletons (`useProjectStore`,
    // `useGtSimConnectionStore`) after mount to exercise re-sync behavior.
    // Without unmounting, a previous test's still-subscribed hook instance
    // would react to a later test's `setState` calls too (no RTL auto-cleanup
    // is configured in this project's vitest setup — see `helpers/setup.ts`).
    cleanup();
    vi.unstubAllGlobals();
  });

  it('does not sync while the GT_Sim backend is disconnected', () => {
    useProjectStore.setState({ projectsRoot: '/home/user/projects' });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useProjectsRootSync(), { wrapper: Wrapper });

    expect(result.current.status).toBe('idle');
    expect(result.current.editorProjectsRoot).toBe('/home/user/projects');
    expect(putCalls).toHaveLength(0);
  });

  it('does not sync while the editor projects root is unknown (null)', () => {
    connectGtSim();
    const { Wrapper } = makeWrapper();
    renderHook(() => useProjectsRootSync(), { wrapper: Wrapper });

    expect(putCalls).toHaveLength(0);
  });

  it('syncs to GT_Sim once connected and the editor root is known', async () => {
    connectGtSim();
    useProjectStore.setState({ projectsRoot: '/home/user/projects' });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useProjectsRootSync(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe('synced'));
    expect(putCalls).toEqual([
      { url: expect.stringContaining('/api/config/projects-root'), body: { projects_root: '/home/user/projects' } },
    ]);
  });

  it('re-syncs when the editor projects root changes', async () => {
    connectGtSim();
    useProjectStore.setState({ projectsRoot: '/root-a' });
    const { Wrapper } = makeWrapper();
    const { result, rerender } = renderHook(() => useProjectsRootSync(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe('synced'));
    expect(putCalls).toHaveLength(1);

    act(() => {
      useProjectStore.setState({ projectsRoot: '/root-b' });
    });
    rerender();

    await waitFor(() => expect(putCalls).toHaveLength(2));
    expect(putCalls[1]?.body).toEqual({ projects_root: '/root-b' });
  });

  it('does not re-fire for the same root across re-renders', async () => {
    connectGtSim();
    useProjectStore.setState({ projectsRoot: '/root-a' });
    const { Wrapper } = makeWrapper();
    const { result, rerender } = renderHook(() => useProjectsRootSync(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe('synced'));
    rerender();
    rerender();

    expect(putCalls).toHaveLength(1);
  });

  it('resync() manually retries the current root', async () => {
    connectGtSim();
    useProjectStore.setState({ projectsRoot: '/root-a' });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useProjectsRootSync(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe('synced'));
    expect(putCalls).toHaveLength(1);

    act(() => {
      result.current.resync();
    });

    await waitFor(() => expect(putCalls).toHaveLength(2));
  });
});
