/**
 * Regression test for a "Maximum update depth exceeded" render loop
 * (React error #185 in production builds) discovered in `RunFormPanel`.
 *
 * Root cause: `SimulationRunForm` exposed its request-builder closure to
 * `RunFormPanel` via `useEffect(() => { onRequestBuilder?.(...) })` — no
 * dependency array, so it re-ran on every render — while `RunFormPanel`
 * passed its raw `useState` setter directly as `onRequestBuilder`. Calling a
 * `useState` setter with a function argument makes React treat it as a
 * *functional updater* and invoke it immediately rather than storing it, so
 * every commit produced a brand-new state value (the return value of the
 * always-fresh `buildRequest` closure), which is always referentially
 * different from the previous state, which scheduled another render, which
 * re-ran the no-deps effect — forever. This reproduced reliably in a real
 * (non-minified) browser the moment a scenario was selected in the run form
 * (`RunFormPanel` first mounts `SimulationRunForm` once `scenario` is
 * non-null) — see the trunk debugging report for the full repro trace.
 *
 * This test renders the full `RunFormPanel` (the actual composition that
 * broke), drives it through project + scenario selection exactly like the
 * reported user flow, and asserts React never logs a
 * "Maximum update depth exceeded" error.
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import { resetGtSimApiCacheForTest } from '../../../features/gt-sim/lib/api';
import { RunFormPanel } from '../../../features/gt-sim/run-form/RunFormPanel';
import { initTestI18n } from '../../helpers/render-with-providers';

beforeAll(async () => {
  await initTestI18n();
});

/** Minimal fake WebSocket — `PresetSelector`'s `usePresetWatcher` opens one
 * on mount (`/ws/presets/{projectId}`); it must not throw in jsdom. */
class FakeWebSocket {
  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  constructor(url: string) {
    this.url = url;
  }
  send(): void {}
  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }
}

function mockResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, Wrapper };
}

describe('RunFormPanel (render-loop regression)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    useGtSimConnectionStore.getState().reset();
    resetGtSimApiCacheForTest();
    useGtSimConnectionStore.getState().applyStatus({
      state: 'ready',
      endpoints: { restBaseUrl: 'http://127.0.0.1:8000', wsBaseUrl: 'ws://127.0.0.1:8000', grpcPort: 50051 },
    });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/projects')) {
          return Promise.resolve(
            mockResponse([
              {
                project_id: 'builtin',
                name: 'Built-in Samples',
                description: '',
                is_builtin: true,
                scenario_count: 1,
                road_count: 0,
                file_count: 1,
                created_at: '',
                updated_at: '',
              },
            ]),
          );
        }
        if (url.includes('/scenarios') && !url.includes('/presets')) {
          return Promise.resolve(
            mockResponse([
              {
                file: 'acc-test.xosc',
                filename: 'acc-test.xosc',
                road_file: null,
                entities: [],
                // A non-empty param list mounts ParameterPanel's preset tab
                // strip (`PresetSelector`) — exactly the subtree the real
                // crash occurred in.
                params: [{ name: 'EgoSpeed', type: 'double', value: '10' }],
                has_controller: false,
              },
            ]),
          );
        }
        if (url.includes('/presets')) {
          return Promise.resolve(mockResponse([]));
        }
        if (url.includes('/config/execution-defaults')) {
          return Promise.resolve(
            mockResponse({
              hz: 100,
              headless: true,
              record: false,
              no_realtime: false,
              timeout: 120,
              osi: { enabled: true, ip: '127.0.0.1' },
              autolight: false,
            }),
          );
        }
        if (url.includes('/manual-drive/config')) {
          return Promise.resolve(mockResponse({}));
        }
        return Promise.resolve(mockResponse({}));
      }),
    );

    // React logs the render-loop invariant violation via `console.error`
    // (dev builds) rather than throwing — assert on the spy rather than
    // relying on an uncaught exception.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    consoleErrorSpy.mockRestore();
  });

  it('does not enter a "Maximum update depth exceeded" render loop when a scenario is selected', async () => {
    const { Wrapper } = makeWrapper();
    render(<RunFormPanel />, { wrapper: Wrapper });

    const [projectSelect] = screen.getAllByRole('combobox');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Built-in Samples' })).toBeInTheDocument());
    fireEvent.change(projectSelect, { target: { value: 'builtin' } });

    await waitFor(() => expect(screen.getByRole('option', { name: 'acc-test.xosc' })).toBeInTheDocument());
    const scenarioSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(scenarioSelect, { target: { value: 'acc-test.xosc' } });

    // `SimulationRunForm` (and the ParameterPanel/PresetSelector subtree
    // that mounts alongside it) is now mounted — the real crash's exact
    // trigger point. Let queries/effects settle.
    await waitFor(() => expect(screen.getByText('EgoSpeed')).toBeInTheDocument());

    const loopErrors = consoleErrorSpy.mock.calls
      .flat()
      .filter((arg): arg is string => typeof arg === 'string')
      .filter((msg) => /Maximum update depth exceeded/.test(msg));
    expect(loopErrors).toHaveLength(0);
  });
});
