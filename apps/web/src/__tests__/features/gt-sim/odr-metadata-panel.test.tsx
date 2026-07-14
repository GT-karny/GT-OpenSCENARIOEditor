import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { OdrMetadata } from '@osce/esmini';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import { resetGtSimApiCacheForTest } from '../../../features/gt-sim/lib/api';
import { OdrMetadataPanel } from '../../../features/gt-sim/odr';
import { initTestI18n } from '../../helpers/render-with-providers';

beforeAll(async () => {
  await initTestI18n();
});

function mockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
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

const FULL_METADATA: OdrMetadata = {
  warnings: {
    version: { rev_major: 1, rev_minor: 7 },
    unsupported_elements: 1,
    unsupported_attributes: 0,
    removed16_hits: 0,
    entries: ['<userData> on <road id="1"> not fully supported'],
  },
  user_data: [{ owner_path: 'road[1]', context_id: '1', xml: '<userData code="x"/>' }],
  data_quality: [{ owner_path: 'road[1]/dataQuality', context_id: '1', xml: '<dataQuality/>' }],
  signals: [
    {
      road_id: '1',
      signal_id: '10',
      has_semantics: true,
      semantics: {
        speeds: [{ type: 'limit', value: 50, unit: 'km/h' }],
        lane_types: ['driving'],
        priority_types: ['right-before-left'],
        prohibited: [{ kind: 'overtake', category: 'truck' }],
        warning_count: 1,
      },
      dependencies: [{ id: '11', type: 'signal' }],
      references: [],
      temporary: true,
      invalidated: false,
    },
  ],
  junction_priorities: [{ junction_id: 'j1', type: 'default', priorities: [{ high: '1', low: '2' }] }],
  crosswalks: [{ junction_id: 'j1', id: 'cw1', crossing_road: '3', road_at_start: '1', road_at_end: '2', synth_object_id: 100 }],
  railroad: {
    switches: [
      {
        road_id: '5',
        name: 'sw-a',
        id: 'sw1',
        position: 'left',
        main_track: { id: '5', s: 10, dir: '+' },
        side_track: { id: '6', s: 12, dir: '+' },
        partner: null,
      },
    ],
    stations: [
      {
        id: 'st1',
        name: 'Central',
        type: 'passenger',
        platforms: [{ id: 'p1', name: 'A', segments: [{ road_id: '7', s_start: 0, s_end: 20, side: 'right' }] }],
      },
    ],
  },
  lane_layers: {
    mode: 'permanent',
    roads: [
      {
        road_id: '1',
        active_mode: 'permanent',
        has_temporary: true,
        temp_s_start: 0,
        temp_s_end: 50,
        layers: [{ name: 'permanent', lane_offset_count: 2, sections: [{ s: 0, length: 100, has_length: true, lane_count: 2 }] }],
      },
    ],
  },
  virtual_junctions: [
    {
      junction_id: 'vj1',
      name: 'merge',
      main_road_id: '1',
      main_road_length: 200,
      s_start: 10,
      s_end: 30,
      orientation: '+',
      anchor_count: 2,
      connection_count: 3,
    },
  ],
};

describe('OdrMetadataPanel', () => {
  beforeEach(() => {
    useGtSimConnectionStore.getState().reset();
    resetGtSimApiCacheForTest();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  function connect() {
    useGtSimConnectionStore.getState().applyStatus({
      state: 'ready',
      endpoints: { restBaseUrl: 'http://127.0.0.1:8000', wsBaseUrl: 'ws://127.0.0.1:8000', grpcPort: 50051 },
    });
  }

  it('renders every section from a full metadata payload when expanded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(mockResponse(FULL_METADATA))),
    );
    connect();
    const { Wrapper } = makeWrapper();
    render(<OdrMetadataPanel projectId="p1" scenarioFile="s1.xosc" defaultOpen />, { wrapper: Wrapper });

    // Header — badge text depends on the (async) query result, so wait for it
    // rather than asserting on the initial "0 warning(s)" / loading render.
    expect(await screen.findByText('1 warning(s)')).toBeInTheDocument();
    expect(screen.getByText('1 virtual junction(s)')).toBeInTheDocument();

    // Parse warnings
    expect(screen.getByText('Parse warnings')).toBeInTheDocument();
    expect(screen.getByText(/OpenDRIVE 1.7/)).toBeInTheDocument();

    // userData / dataQuality (grouped by road)
    expect(screen.getByText('userData')).toBeInTheDocument();
    expect(screen.getByText('dataQuality')).toBeInTheDocument();
    expect(screen.getAllByText('road 1').length).toBeGreaterThan(0);

    // Signals
    expect(screen.getByText('Signals (semantics)')).toBeInTheDocument();
    expect(screen.getByText('1 speed(s)')).toBeInTheDocument();
    expect(screen.getByText('temp')).toBeInTheDocument();

    // Virtual junctions
    expect(screen.getByText('Virtual junctions')).toBeInTheDocument();
    expect(screen.getByText(/merge/)).toBeInTheDocument();

    // Lane layers
    expect(screen.getByText('Lane layers')).toBeInTheDocument();
    expect(screen.getByText(/temporary covers s 0–50/)).toBeInTheDocument();

    // Junction priorities
    expect(screen.getByText('Junction priorities')).toBeInTheDocument();

    // Crosswalks
    expect(screen.getByText('Crosswalks')).toBeInTheDocument();

    // Railroad
    expect(screen.getByText('Railroad')).toBeInTheDocument();
    expect(screen.getByText('switches (1)')).toBeInTheDocument();
    expect(screen.getByText('stations (1)')).toBeInTheDocument();
  });

  it('hides the sparse P9b sections (virtual junctions / lane layers) when absent from the payload', async () => {
    const sparse: OdrMetadata = { ...FULL_METADATA, virtual_junctions: [], lane_layers: { mode: 'permanent', roads: [] } };
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(mockResponse(sparse))),
    );
    connect();
    const { Wrapper } = makeWrapper();
    render(<OdrMetadataPanel projectId="p1" scenarioFile="s1.xosc" defaultOpen />, { wrapper: Wrapper });

    // Wait for the query to actually resolve (a section that's always
    // present once loaded) before asserting on the sparse ones' absence —
    // otherwise this would trivially pass during the loading state too.
    await screen.findByText('Parse warnings');
    expect(screen.queryByText('Virtual junctions')).not.toBeInTheDocument();
    expect(screen.queryByText('Lane layers')).not.toBeInTheDocument();
    expect(screen.queryByText(/virtual junction\(s\)/)).not.toBeInTheDocument();
  });

  it('shows an inline error when the metadata request fails, without a retry loop (retry disabled)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(mockResponse({ detail: 'not found' }, false))),
    );
    connect();
    const { Wrapper } = makeWrapper();
    render(<OdrMetadataPanel projectId="p1" scenarioFile="missing.xosc" defaultOpen />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText(/Metadata unavailable:/)).toBeInTheDocument());
  });

  it('does not query while collapsed by default, and expands on header click', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(mockResponse(FULL_METADATA)));
    vi.stubGlobal('fetch', fetchSpy);
    connect();
    const { Wrapper } = makeWrapper();
    render(<OdrMetadataPanel projectId="p1" scenarioFile="s1.xosc" />, { wrapper: Wrapper });

    // Collapsed: header renders, section content does not.
    expect(screen.getByText('OpenDRIVE metadata')).toBeInTheDocument();
    expect(screen.queryByText('Parse warnings')).not.toBeInTheDocument();

    screen.getByText('OpenDRIVE metadata').closest('button')!.click();
    expect(await screen.findByText('Parse warnings')).toBeInTheDocument();
  });

  it('does not fetch while the backend is disconnected (api === null)', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(mockResponse(FULL_METADATA)));
    vi.stubGlobal('fetch', fetchSpy);
    const { Wrapper } = makeWrapper();
    render(<OdrMetadataPanel projectId="p1" scenarioFile="s1.xosc" defaultOpen />, { wrapper: Wrapper });

    // enabled: false — the query never leaves 'pending'/idle, so no loading
    // text (react-query v5: isLoading requires isFetching too) and no fetch.
    expect(screen.getByText('OpenDRIVE metadata')).toBeInTheDocument();
    expect(screen.queryByText('Loading metadata…')).not.toBeInTheDocument();
    expect(screen.queryByText('Parse warnings')).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
