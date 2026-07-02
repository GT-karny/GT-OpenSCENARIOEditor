import { describe, it, expect, beforeEach } from 'vitest';
import type { ParameterValueDistributionDocument } from '@osce/shared';
import {
  useDistributionStore,
  selectSingleParameterEntries,
  selectMultiParameterEntries,
} from '../../stores/distribution-store';

const store = useDistributionStore;

beforeEach(() => {
  store.getState().clear();
});

describe('distribution-store mode enforcement', () => {
  it('defaults to deterministic mode with no document', () => {
    expect(store.getState().document).toBeNull();
    expect(store.getState().getMode()).toBe('deterministic');
  });

  it('attaching a deterministic entry creates a deterministic document', () => {
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Speed',
      distribution: { kind: 'range', stepWidth: 5, range: { lowerLimit: 0, upperLimit: 10 } },
    });
    const doc = store.getState().document;
    expect(doc?.distribution.kind).toBe('deterministic');
    expect(store.getState().getMode()).toBe('deterministic');
    expect(selectSingleParameterEntries(doc)).toHaveLength(1);
  });

  it('setMode switches kind and clears entries (only one kind per document)', () => {
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Speed',
      distribution: { kind: 'set', values: ['1', '2'] },
    });
    expect(selectSingleParameterEntries(store.getState().document)).toHaveLength(1);

    store.getState().setMode('stochastic');
    expect(store.getState().getMode()).toBe('stochastic');
    expect(store.getState().document?.distribution.kind).toBe('stochastic');
    expect(selectSingleParameterEntries(store.getState().document)).toHaveLength(0);
  });

  it('ignores an entry whose mode does not match the current mode', () => {
    store.getState().setMode('stochastic');
    // Deterministic entry should be ignored while in stochastic mode.
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Speed',
      distribution: { kind: 'set', values: ['1'] },
    });
    expect(selectSingleParameterEntries(store.getState().document)).toHaveLength(0);
    expect(store.getState().document?.distribution.kind).toBe('stochastic');
  });

  it('setMode is a no-op when already in the requested mode', () => {
    store.getState().setMode('deterministic');
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Speed',
      distribution: { kind: 'set', values: ['1'] },
    });
    store.getState().setMode('deterministic');
    expect(selectSingleParameterEntries(store.getState().document)).toHaveLength(1);
  });
});

describe('distribution-store entry CRUD', () => {
  it('attachToParameter replaces an existing entry for the same parameter', () => {
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Speed',
      distribution: { kind: 'set', values: ['1'] },
    });
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Speed',
      distribution: { kind: 'range', stepWidth: 1, range: { lowerLimit: 0, upperLimit: 3 } },
    });
    const entries = selectSingleParameterEntries(store.getState().document);
    expect(entries).toHaveLength(1);
    expect(entries[0].distribution.kind).toBe('range');
  });

  it('attaches multiple distinct parameters', () => {
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Speed',
      distribution: { kind: 'set', values: ['1'] },
    });
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Distance',
      distribution: { kind: 'set', values: ['5'] },
    });
    expect(selectSingleParameterEntries(store.getState().document)).toHaveLength(2);
  });

  it('updateEntry replaces in place (alias of attachToParameter)', () => {
    store.getState().attachToParameter({
      mode: 'stochastic',
      parameterName: 'Speed',
      distribution: { kind: 'normal', expectedValue: 5, variance: 1 },
    });
    store.getState().updateEntry({
      mode: 'stochastic',
      parameterName: 'Speed',
      distribution: { kind: 'uniform', range: { lowerLimit: 0, upperLimit: 10 } },
    });
    const entries = selectSingleParameterEntries(store.getState().document);
    expect(entries).toHaveLength(1);
    expect(entries[0].distribution.kind).toBe('uniform');
  });

  it('removeEntry removes only the named parameter', () => {
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Speed',
      distribution: { kind: 'set', values: ['1'] },
    });
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Distance',
      distribution: { kind: 'set', values: ['5'] },
    });
    store.getState().removeEntry('Speed');
    const entries = selectSingleParameterEntries(store.getState().document);
    expect(entries).toHaveLength(1);
    expect(entries[0].parameterName).toBe('Distance');
  });

  it('setStochasticSettings updates test runs and seed in stochastic mode', () => {
    store.getState().setMode('stochastic');
    store.getState().setStochasticSettings({ numberOfTestRuns: 42, randomSeed: 7 });
    const dist = store.getState().document?.distribution;
    expect(dist?.kind).toBe('stochastic');
    if (dist?.kind === 'stochastic') {
      expect(dist.numberOfTestRuns).toBe(42);
      expect(dist.randomSeed).toBe(7);
    }
  });

  it('setScenarioFilepath sets the referenced base scenario', () => {
    store.getState().setScenarioFilepath('base.xosc');
    expect(store.getState().document?.scenarioFilepath).toBe('base.xosc');
  });

  it('loadDocument replaces the document wholesale and exposes multi-parameter entries', () => {
    const doc: ParameterValueDistributionDocument = {
      id: 'x',
      fileHeader: { revMajor: 1, revMinor: 3, date: '2026-01-01', description: '', author: '' },
      scenarioFilepath: 'base.xosc',
      distribution: {
        kind: 'deterministic',
        entries: [
          {
            kind: 'multiParameter',
            valueSets: [
              {
                assignments: [
                  { parameterRef: 'A', value: '1' },
                  { parameterRef: 'B', value: '2' },
                ],
              },
            ],
          },
          {
            kind: 'singleParameter',
            parameterName: 'Speed',
            distribution: { kind: 'set', values: ['1'] },
          },
        ],
      },
    };
    store.getState().loadDocument(doc);
    expect(selectSingleParameterEntries(store.getState().document)).toHaveLength(1);
    expect(selectMultiParameterEntries(store.getState().document)).toHaveLength(1);
  });

  it('clear resets to an empty store', () => {
    store.getState().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Speed',
      distribution: { kind: 'set', values: ['1'] },
    });
    store.getState().clear();
    expect(store.getState().document).toBeNull();
  });
});
