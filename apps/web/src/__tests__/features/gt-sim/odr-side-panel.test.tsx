import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { OdrMetadata } from '@osce/esmini';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import { resetGtSimApiCacheForTest } from '../../../features/gt-sim/lib/api';
import { OdrMetadataSidePanel } from '../../../features/gt-sim/odr';
import { initTestI18n } from '../../helpers/render-with-providers';

beforeAll(async () => {
  await initTestI18n();
});

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

const EMPTY_METADATA: OdrMetadata = {
  warnings: { version: { rev_major: 1, rev_minor: 7 }, unsupported_elements: 0, unsupported_attributes: 0, removed16_hits: 0, entries: [] },
  user_data: [],
  data_quality: [],
  signals: [],
  junction_priorities: [],
  crosswalks: [],
  railroad: { switches: [], stations: [] },
  lane_layers: { mode: 'permanent', roads: [] },
  virtual_junctions: [],
};

describe('OdrMetadataSidePanel', () => {
  beforeEach(() => {
    useGtSimConnectionStore.getState().reset();
    resetGtSimApiCacheForTest();
    useGtSimConnectionStore.getState().applyStatus({
      state: 'ready',
      endpoints: { restBaseUrl: 'http://127.0.0.1:8000', wsBaseUrl: 'ws://127.0.0.1:8000', grpcPort: 50051 },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/projects')) {
          return Promise.resolve(mockResponse([{ project_id: 'p1', name: 'Project One', description: '', is_builtin: false, scenario_count: 1, road_count: 1, file_count: 1, created_at: '', updated_at: '' }]));
        }
        if (url.includes('/scenarios') && !url.includes('odr-metadata')) {
          return Promise.resolve(
            mockResponse([{ file: 's1.xosc', filename: 's1.xosc', road_file: null, entities: [], params: [], has_controller: false }]),
          );
        }
        if (url.includes('odr-metadata')) {
          return Promise.resolve(mockResponse(EMPTY_METADATA));
        }
        return Promise.resolve(mockResponse({}));
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('prompts for a project + scenario before rendering the metadata panel', () => {
    const { Wrapper } = makeWrapper();
    render(<OdrMetadataSidePanel />, { wrapper: Wrapper });

    expect(
      screen.getByText('Select a project and a scenario to inspect its OpenDRIVE metadata.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('OpenDRIVE metadata')).not.toBeInTheDocument();
  });

  it('mounts OdrMetadataPanel (expanded) once a project and scenario are picked', async () => {
    const { Wrapper } = makeWrapper();
    render(<OdrMetadataSidePanel />, { wrapper: Wrapper });

    const [projectSelect, scenarioSelect] = screen.getAllByRole('combobox');
    // Wait for the projects query to resolve so the <option> actually exists
    // before selecting it (jsdom silently ignores a <select> value with no
    // matching option).
    await waitFor(() => expect(screen.getByRole('option', { name: 'Project One' })).toBeInTheDocument());
    fireEvent.change(projectSelect, { target: { value: 'p1' } });

    await waitFor(() => expect(screen.getByRole('option', { name: 's1.xosc' })).toBeInTheDocument());
    fireEvent.change(scenarioSelect, { target: { value: 's1.xosc' } });

    expect(await screen.findByText('OpenDRIVE metadata')).toBeInTheDocument();
    // defaultOpen is passed through, so the (empty) sections render immediately.
    expect(await screen.findByText('Parse warnings')).toBeInTheDocument();
  });
});
