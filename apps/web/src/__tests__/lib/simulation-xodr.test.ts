import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared, mutable mock state. Declared via vi.hoisted so it is initialized
// before the (hoisted) vi.mock factories that close over it.
const h = vi.hoisted(() => ({
  serializeFormatted: vi.fn(() => '<OpenDRIVE from="model"/>'),
  storeState: { roadNetworkXml: null as string | null, roadNetwork: null as unknown },
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

import { getSimulationXodr } from '../../lib/simulation-xodr';

describe('getSimulationXodr', () => {
  beforeEach(() => {
    h.storeState.roadNetworkXml = null;
    h.storeState.roadNetwork = null;
    h.serializeFormatted.mockClear();
  });

  it('returns the raw editor XML verbatim when present (not degraded)', () => {
    h.storeState.roadNetworkXml = '<OpenDRIVE from="raw"/>';
    h.storeState.roadNetwork = { some: 'model' };

    const result = getSimulationXodr();

    expect(result).toEqual({ xml: '<OpenDRIVE from="raw"/>', degraded: false });
    // Raw XML wins — the serializer must not be invoked.
    expect(h.serializeFormatted).not.toHaveBeenCalled();
  });

  it('re-serializes from the parsed model when raw XML is missing (degraded)', () => {
    h.storeState.roadNetworkXml = null;
    h.storeState.roadNetwork = { some: 'model' };

    const result = getSimulationXodr();

    expect(result).toEqual({ xml: '<OpenDRIVE from="model"/>', degraded: true });
    expect(h.serializeFormatted).toHaveBeenCalledTimes(1);
    expect(h.serializeFormatted).toHaveBeenCalledWith(h.storeState.roadNetwork);
  });

  it('returns undefined xml when neither raw XML nor model exists (not degraded)', () => {
    h.storeState.roadNetworkXml = null;
    h.storeState.roadNetwork = null;

    const result = getSimulationXodr();

    expect(result).toEqual({ xml: undefined, degraded: false });
    expect(h.serializeFormatted).not.toHaveBeenCalled();
  });
});
