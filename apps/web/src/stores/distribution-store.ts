import { create } from 'zustand';
import type {
  DeterministicEntry,
  DeterministicSingleDistributionType,
  DistributionDefinition,
  ParameterValueDistributionDocument,
  StochasticDistributionEntry,
  StochasticDistributionType,
} from '@osce/shared';
import { generateId } from '@osce/shared';

/**
 * The distribution mode selects which of the two mutually-exclusive XSD
 * distribution kinds the document holds. A document may only ever contain
 * `<Deterministic>` OR `<Stochastic>`, never both, so the store enforces mode
 * consistency: switching mode clears any entries of the other kind.
 */
export type DistributionMode = 'deterministic' | 'stochastic';

/**
 * A distribution attached to a single declared parameter. This is the unit the
 * attach dialog produces. Multi-parameter (ValueSetDistribution) entries are
 * NOT created through this affordance — they are only rendered read-only when a
 * loaded file contains them (see {@link ParameterValueDistributionDocument}).
 */
export type SingleParameterEntry =
  | {
      mode: 'deterministic';
      parameterName: string;
      distribution: DeterministicSingleDistributionType;
    }
  | { mode: 'stochastic'; parameterName: string; distribution: StochasticDistributionType };

export interface StochasticSettings {
  numberOfTestRuns: number;
  randomSeed?: number;
}

const DEFAULT_STOCHASTIC_TEST_RUNS = 10;

/** A stable empty document header used when the store first receives an entry. */
function createEmptyDocument(mode: DistributionMode): ParameterValueDistributionDocument {
  return {
    id: generateId(),
    fileHeader: {
      revMajor: 1,
      revMinor: 3,
      date: new Date().toISOString().split('T')[0],
      description: 'Parameter value distribution',
      author: '',
    },
    scenarioFilepath: '',
    distribution:
      mode === 'deterministic'
        ? { kind: 'deterministic', entries: [] }
        : { kind: 'stochastic', numberOfTestRuns: DEFAULT_STOCHASTIC_TEST_RUNS, distributions: [] },
  };
}

export interface DistributionState {
  /** The current side-document, or null when no distribution has been created. */
  document: ParameterValueDistributionDocument | null;

  // --- Mode ---
  /**
   * The active distribution mode, derived from the document's distribution kind.
   * Defaults to 'deterministic' when no document exists yet.
   */
  getMode: () => DistributionMode;
  /**
   * Switch the distribution kind. Because the XSD permits only one kind per
   * document, this clears all existing entries (the UI is responsible for
   * confirming this destructive switch with the user first).
   */
  setMode: (mode: DistributionMode) => void;

  // --- Entry CRUD ---
  /**
   * Attach (or replace) a single-parameter distribution for `parameterName`.
   * The entry's mode must match the current mode; a mismatched entry is ignored.
   */
  attachToParameter: (entry: SingleParameterEntry) => void;
  /** Alias of {@link attachToParameter} — replaces any existing entry in place. */
  updateEntry: (entry: SingleParameterEntry) => void;
  /** Remove the single-parameter distribution attached to `parameterName`. */
  removeEntry: (parameterName: string) => void;

  // --- Stochastic settings ---
  setStochasticSettings: (settings: StochasticSettings) => void;

  // --- Document metadata ---
  setScenarioFilepath: (filepath: string) => void;

  // --- I/O ---
  loadDocument: (doc: ParameterValueDistributionDocument) => void;

  // --- Reset ---
  clear: () => void;
}

/** Extract the single-parameter entries a document holds, per the active mode. */
export function selectSingleParameterEntries(
  doc: ParameterValueDistributionDocument | null,
): SingleParameterEntry[] {
  if (!doc) return [];
  if (doc.distribution.kind === 'deterministic') {
    return doc.distribution.entries
      .filter(
        (e): e is Extract<DeterministicEntry, { kind: 'singleParameter' }> =>
          e.kind === 'singleParameter',
      )
      .map((e) => ({
        mode: 'deterministic',
        parameterName: e.parameterName,
        distribution: e.distribution,
      }));
  }
  return doc.distribution.distributions.map((e) => ({
    mode: 'stochastic',
    parameterName: e.parameterName,
    distribution: e.distribution,
  }));
}

/** Extract the read-only multi-parameter (ValueSet) entries a document holds. */
export function selectMultiParameterEntries(
  doc: ParameterValueDistributionDocument | null,
): Extract<DeterministicEntry, { kind: 'multiParameter' }>[] {
  if (!doc || doc.distribution.kind !== 'deterministic') return [];
  return doc.distribution.entries.filter(
    (e): e is Extract<DeterministicEntry, { kind: 'multiParameter' }> =>
      e.kind === 'multiParameter',
  );
}

/**
 * Replace the distribution definition on a document with `mutate` applied to a
 * shallow clone, keeping the rest of the document intact.
 */
function withDistribution(
  doc: ParameterValueDistributionDocument,
  distribution: DistributionDefinition,
): ParameterValueDistributionDocument {
  return { ...doc, distribution };
}

export const useDistributionStore = create<DistributionState>((set, get) => ({
  document: null,

  getMode: () => get().document?.distribution.kind ?? 'deterministic',

  setMode: (mode) => {
    set((state) => {
      const current = state.document;
      if (current && current.distribution.kind === mode) return state;
      const base = current ?? createEmptyDocument(mode);
      // Switching kind clears entries (the two kinds are mutually exclusive).
      if (mode === 'deterministic') {
        return { document: withDistribution(base, { kind: 'deterministic', entries: [] }) };
      }
      const testRuns =
        base.distribution.kind === 'stochastic'
          ? base.distribution.numberOfTestRuns
          : DEFAULT_STOCHASTIC_TEST_RUNS;
      const seed =
        base.distribution.kind === 'stochastic' ? base.distribution.randomSeed : undefined;
      return {
        document: withDistribution(base, {
          kind: 'stochastic',
          numberOfTestRuns: testRuns,
          randomSeed: seed,
          distributions: [],
        }),
      };
    });
  },

  attachToParameter: (entry) => {
    set((state) => {
      const base = state.document ?? createEmptyDocument(entry.mode);
      const dist = base.distribution;

      if (entry.mode === 'deterministic') {
        if (dist.kind !== 'deterministic') return state; // mode mismatch — ignore
        const others = dist.entries.filter(
          (e) => !(e.kind === 'singleParameter' && e.parameterName === entry.parameterName),
        );
        const next: DeterministicEntry = {
          kind: 'singleParameter',
          parameterName: entry.parameterName,
          distribution: entry.distribution,
        };
        return {
          document: withDistribution(base, {
            kind: 'deterministic',
            entries: [...others, next],
          }),
        };
      }

      if (dist.kind !== 'stochastic') return state; // mode mismatch — ignore
      const others = dist.distributions.filter((e) => e.parameterName !== entry.parameterName);
      const next: StochasticDistributionEntry = {
        parameterName: entry.parameterName,
        distribution: entry.distribution,
      };
      return {
        document: withDistribution(base, {
          kind: 'stochastic',
          numberOfTestRuns: dist.numberOfTestRuns,
          randomSeed: dist.randomSeed,
          distributions: [...others, next],
        }),
      };
    });
  },

  updateEntry: (entry) => get().attachToParameter(entry),

  removeEntry: (parameterName) => {
    set((state) => {
      const doc = state.document;
      if (!doc) return state;
      const dist = doc.distribution;
      if (dist.kind === 'deterministic') {
        return {
          document: withDistribution(doc, {
            kind: 'deterministic',
            entries: dist.entries.filter(
              (e) => !(e.kind === 'singleParameter' && e.parameterName === parameterName),
            ),
          }),
        };
      }
      return {
        document: withDistribution(doc, {
          kind: 'stochastic',
          numberOfTestRuns: dist.numberOfTestRuns,
          randomSeed: dist.randomSeed,
          distributions: dist.distributions.filter((e) => e.parameterName !== parameterName),
        }),
      };
    });
  },

  setStochasticSettings: ({ numberOfTestRuns, randomSeed }) => {
    set((state) => {
      const base = state.document ?? createEmptyDocument('stochastic');
      const dist = base.distribution;
      if (dist.kind !== 'stochastic') return state; // only meaningful in stochastic mode
      return {
        document: withDistribution(base, {
          kind: 'stochastic',
          numberOfTestRuns,
          randomSeed,
          distributions: dist.distributions,
        }),
      };
    });
  },

  setScenarioFilepath: (filepath) => {
    set((state) => {
      const base = state.document ?? createEmptyDocument('deterministic');
      return { document: { ...base, scenarioFilepath: filepath } };
    });
  },

  loadDocument: (doc) => set({ document: doc }),

  clear: () => set({ document: null }),
}));
