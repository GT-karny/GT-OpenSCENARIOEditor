/**
 * Undoable commands for the distribution store.
 *
 * The store holds a single small side-document, so each command captures the
 * whole previous document before mutating and restores it on undo by an
 * immutable reference swap — the single-document analogue of the catalog
 * commands' before/after capture. The derivations mirror the previous
 * hand-written store actions exactly, so component behavior is unchanged; the
 * only addition is reversibility.
 *
 * The next document is derived once and cached, so redo reproduces the exact
 * same object rather than a fresh {@link createEmptyDocument} id/date. A subclass
 * returns null from {@link DistributionCommand.nextDocument} to abort as a no-op
 * (mirroring the old actions, which returned the state unchanged for a mode
 * mismatch or a missing document); undo then restores nothing.
 */
import { BaseCommand } from '@osce/scenario-engine';
import type { StoreApi } from 'zustand';
import { generateId } from '@osce/shared';
import type {
  DeterministicEntry,
  DistributionDefinition,
  ParameterValueDistributionDocument,
  StochasticDistributionEntry,
} from '@osce/shared';
import type {
  DistributionMode,
  DistributionState,
  SingleParameterEntry,
  StochasticSettings,
} from './distribution-store';

type GetState = StoreApi<DistributionState>['getState'];
type SetState = StoreApi<DistributionState>['setState'];

export const DEFAULT_STOCHASTIC_TEST_RUNS = 10;

/** A stable empty document header used when the store first receives an entry. */
export function createEmptyDocument(mode: DistributionMode): ParameterValueDistributionDocument {
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

/** Replace the distribution definition on a document, keeping the rest intact. */
function withDistribution(
  doc: ParameterValueDistributionDocument,
  distribution: DistributionDefinition,
): ParameterValueDistributionDocument {
  return { ...doc, distribution };
}

export abstract class DistributionCommand extends BaseCommand {
  private prevDocument: ParameterValueDistributionDocument | null = null;
  // undefined = not yet derived; null = derived to a no-op; a document = applied.
  private derived: ParameterValueDistributionDocument | null | undefined;

  constructor(
    protected readonly get: GetState,
    protected readonly set: SetState,
    description: string,
  ) {
    super(description);
  }

  /** Derive the next document from the current one, or null to no-op. */
  protected abstract nextDocument(
    current: ParameterValueDistributionDocument | null,
  ): ParameterValueDistributionDocument | null;

  execute(): void {
    const current = this.get().document;
    if (this.derived === undefined) this.derived = this.nextDocument(current);
    if (this.derived === null) return; // no-op
    this.prevDocument = current;
    this.set({ document: this.derived });
  }

  undo(): void {
    if (!this.derived) return; // never applied (no-op)
    this.set({ document: this.prevDocument });
  }
}

export class SetModeCommand extends DistributionCommand {
  constructor(private readonly mode: DistributionMode, get: GetState, set: SetState) {
    super(get, set, 'Set distribution mode');
  }

  protected nextDocument(current: ParameterValueDistributionDocument | null) {
    if (current && current.distribution.kind === this.mode) return null; // already in mode
    const base = current ?? createEmptyDocument(this.mode);
    // Switching kind clears entries (the two kinds are mutually exclusive).
    if (this.mode === 'deterministic') {
      return withDistribution(base, { kind: 'deterministic', entries: [] });
    }
    const testRuns =
      base.distribution.kind === 'stochastic'
        ? base.distribution.numberOfTestRuns
        : DEFAULT_STOCHASTIC_TEST_RUNS;
    const seed = base.distribution.kind === 'stochastic' ? base.distribution.randomSeed : undefined;
    return withDistribution(base, {
      kind: 'stochastic',
      numberOfTestRuns: testRuns,
      randomSeed: seed,
      distributions: [],
    });
  }
}

export class AttachParameterCommand extends DistributionCommand {
  constructor(private readonly entry: SingleParameterEntry, get: GetState, set: SetState) {
    super(get, set, 'Attach distribution');
  }

  protected nextDocument(current: ParameterValueDistributionDocument | null) {
    const entry = this.entry;
    const base = current ?? createEmptyDocument(entry.mode);
    const dist = base.distribution;

    if (entry.mode === 'deterministic') {
      if (dist.kind !== 'deterministic') return null; // mode mismatch — ignore
      const others = dist.entries.filter(
        (e) => !(e.kind === 'singleParameter' && e.parameterName === entry.parameterName),
      );
      const next: DeterministicEntry = {
        kind: 'singleParameter',
        parameterName: entry.parameterName,
        distribution: entry.distribution,
      };
      return withDistribution(base, { kind: 'deterministic', entries: [...others, next] });
    }

    if (dist.kind !== 'stochastic') return null; // mode mismatch — ignore
    const others = dist.distributions.filter((e) => e.parameterName !== entry.parameterName);
    const next: StochasticDistributionEntry = {
      parameterName: entry.parameterName,
      distribution: entry.distribution,
    };
    return withDistribution(base, {
      kind: 'stochastic',
      numberOfTestRuns: dist.numberOfTestRuns,
      randomSeed: dist.randomSeed,
      distributions: [...others, next],
    });
  }
}

export class RemoveEntryCommand extends DistributionCommand {
  constructor(private readonly parameterName: string, get: GetState, set: SetState) {
    super(get, set, 'Remove distribution');
  }

  protected nextDocument(current: ParameterValueDistributionDocument | null) {
    if (!current) return null;
    const dist = current.distribution;
    if (dist.kind === 'deterministic') {
      return withDistribution(current, {
        kind: 'deterministic',
        entries: dist.entries.filter(
          (e) => !(e.kind === 'singleParameter' && e.parameterName === this.parameterName),
        ),
      });
    }
    return withDistribution(current, {
      kind: 'stochastic',
      numberOfTestRuns: dist.numberOfTestRuns,
      randomSeed: dist.randomSeed,
      distributions: dist.distributions.filter((e) => e.parameterName !== this.parameterName),
    });
  }
}

export class SetStochasticSettingsCommand extends DistributionCommand {
  constructor(private readonly settings: StochasticSettings, get: GetState, set: SetState) {
    super(get, set, 'Update stochastic settings');
  }

  protected nextDocument(current: ParameterValueDistributionDocument | null) {
    const base = current ?? createEmptyDocument('stochastic');
    const dist = base.distribution;
    if (dist.kind !== 'stochastic') return null; // only meaningful in stochastic mode
    return withDistribution(base, {
      kind: 'stochastic',
      numberOfTestRuns: this.settings.numberOfTestRuns,
      randomSeed: this.settings.randomSeed,
      distributions: dist.distributions,
    });
  }
}

export class SetScenarioFilepathCommand extends DistributionCommand {
  constructor(private readonly filepath: string, get: GetState, set: SetState) {
    super(get, set, 'Set scenario file path');
  }

  protected nextDocument(current: ParameterValueDistributionDocument | null) {
    const base = current ?? createEmptyDocument('deterministic');
    return { ...base, scenarioFilepath: this.filepath };
  }
}
