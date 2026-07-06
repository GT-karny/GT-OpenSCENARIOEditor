import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RoadNetworkRawXml } from '../../stores/editor-store';

// Shared, mutable mock state. Declared via vi.hoisted so it is initialized
// before the (hoisted) vi.mock factories that close over it. `revision` stands
// in for the live OpenDRIVE command-history revision.
const h = vi.hoisted(() => ({
  serializeFormatted: vi.fn(() => '<OpenDRIVE from="model"/>'),
  storeState: {
    roadNetworkRawXml: null as RoadNetworkRawXml | null,
    roadNetwork: null as unknown,
  },
  revision: 0,
}));

// Mock the OpenDRIVE serializer so we can assert re-serialization without
// exercising the real XML builder.
vi.mock('@osce/opendrive', () => ({
  XodrSerializer: vi.fn().mockImplementation(() => ({ serializeFormatted: h.serializeFormatted })),
}));

// Mock the editor store; getState() returns whatever we set per-test.
vi.mock('../../stores/editor-store', () => ({
  useEditorStore: { getState: () => h.storeState },
}));

// Mock the OpenDRIVE store so the live revision is controllable per-test. This
// is the single source of cache validity: the verbatim text is valid iff its
// `validForRevision` equals this revision.
vi.mock('../../hooks/use-opendrive-store', () => ({
  getOpenDriveStoreApi: () => ({
    getState: () => ({
      getCommandHistory: () => ({ getRevision: () => h.revision }),
    }),
  }),
}));

import { getSimulationXodr, getValidRoadXml } from '../../lib/simulation-xodr';

const RAW = '<OpenDRIVE from="raw"/>';
const MODEL = '<OpenDRIVE from="model"/>';

beforeEach(() => {
  h.storeState.roadNetworkRawXml = null;
  h.storeState.roadNetwork = null;
  h.revision = 0;
  h.serializeFormatted.mockClear();
});

describe('getSimulationXodr', () => {
  it('returns the verbatim text when the cache is valid for the current revision (not degraded)', () => {
    h.storeState.roadNetworkRawXml = { text: RAW, validForRevision: 5 };
    h.storeState.roadNetwork = { some: 'model' };
    h.revision = 5;

    const result = getSimulationXodr();

    expect(result).toEqual({ xml: RAW, degraded: false });
    // Valid verbatim text wins — the serializer must not be invoked.
    expect(h.serializeFormatted).not.toHaveBeenCalled();
  });

  it('re-serializes from the model when the revision has moved off the cache (degraded)', () => {
    h.storeState.roadNetworkRawXml = { text: RAW, validForRevision: 5 };
    h.storeState.roadNetwork = { some: 'model' };
    h.revision = 6; // an edit moved the history position

    const result = getSimulationXodr();

    expect(result).toEqual({ xml: MODEL, degraded: true });
    expect(h.serializeFormatted).toHaveBeenCalledTimes(1);
    expect(h.serializeFormatted).toHaveBeenCalledWith(h.storeState.roadNetwork);
  });

  it('re-validates the cache when an undo returns to validForRevision (undo-to-baseline)', () => {
    h.storeState.roadNetworkRawXml = { text: RAW, validForRevision: 5 };
    h.storeState.roadNetwork = { some: 'model' };

    // Edited away from the baseline → degraded, re-serialized.
    h.revision = 6;
    expect(getSimulationXodr()).toEqual({ xml: MODEL, degraded: true });

    // Undo back to the baseline revision → the same cached text is valid again.
    h.revision = 5;
    expect(getSimulationXodr()).toEqual({ xml: RAW, degraded: false });
  });

  it('re-serializes from the model when there is no cache (degraded)', () => {
    h.storeState.roadNetworkRawXml = null;
    h.storeState.roadNetwork = { some: 'model' };
    h.revision = 3;

    const result = getSimulationXodr();

    expect(result).toEqual({ xml: MODEL, degraded: true });
    expect(h.serializeFormatted).toHaveBeenCalledTimes(1);
  });

  it('returns undefined xml when neither cache nor model exists (not degraded)', () => {
    h.storeState.roadNetworkRawXml = null;
    h.storeState.roadNetwork = null;

    const result = getSimulationXodr();

    expect(result).toEqual({ xml: undefined, degraded: false });
    expect(h.serializeFormatted).not.toHaveBeenCalled();
  });
});

describe('getValidRoadXml', () => {
  it('returns the text when the cache matches the current revision', () => {
    h.storeState.roadNetworkRawXml = { text: RAW, validForRevision: 5 };
    h.revision = 5;
    expect(getValidRoadXml()).toBe(RAW);
  });

  it('returns null when the cache is stale for the current revision', () => {
    h.storeState.roadNetworkRawXml = { text: RAW, validForRevision: 5 };
    h.revision = 6;
    expect(getValidRoadXml()).toBeNull();
  });

  it('returns null when there is no cache', () => {
    h.storeState.roadNetworkRawXml = null;
    expect(getValidRoadXml()).toBeNull();
  });
});
