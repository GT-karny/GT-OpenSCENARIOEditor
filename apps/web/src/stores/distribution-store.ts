import { create } from 'zustand';
import type {
  DeterministicEntry,
  DeterministicSingleDistributionType,
  ParameterValueDistributionDocument,
  StochasticDistributionType,
} from '@osce/shared';
import { CommandHistory } from '@osce/scenario-engine';
import {
  AttachParameterCommand,
  RemoveEntryCommand,
  SetModeCommand,
  SetScenarioFilepathCommand,
  SetStochasticSettingsCommand,
} from './distribution-commands';
import type { DistributionCommand } from './distribution-commands';
import { useDocumentRegistry } from './document-registry';

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

export interface DistributionState {
  /** The current side-document, or null when no distribution has been created. */
  document: ParameterValueDistributionDocument | null;

  /** Command history for undo/redo; the document registry derives dirty from it. */
  getCommandHistory: () => CommandHistory;
  /** Undo the last distribution edit (focus-routed from keyboard/menu). */
  undoDistribution: () => void;
  /** Redo the last undone distribution edit. */
  redoDistribution: () => void;

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

// One command history per store instance (mirrors scenario/catalog stores).
const commandHistory = new CommandHistory();

export const useDistributionStore = create<DistributionState>((set, get) => {
  /**
   * Run a mutation command through the shared history. The command's own set
   * fires before the history revision advances, so nudge subscribers afterwards
   * to re-read the now-current revision (the registry mirrors it as dirty).
   */
  const runCommand = (cmd: DistributionCommand): void => {
    commandHistory.execute(cmd);
    set((s) => ({ document: s.document }));
  };

  return {
    document: null,

    getCommandHistory: () => commandHistory,

    undoDistribution: () => {
      commandHistory.undo();
      // The revision moved even if the command no-op'd; nudge subscribers so the
      // registry mirror re-reads it (mirrors catalog-store's undoCatalog).
      set((s) => ({ document: s.document }));
    },
    redoDistribution: () => {
      commandHistory.redo();
      set((s) => ({ document: s.document }));
    },

    getMode: () => get().document?.distribution.kind ?? 'deterministic',

    setMode: (mode) => {
      const current = get().document;
      if (current && current.distribution.kind === mode) return; // no-op — no command
      runCommand(new SetModeCommand(mode, get, set));
    },

    attachToParameter: (entry) => runCommand(new AttachParameterCommand(entry, get, set)),

    updateEntry: (entry) => get().attachToParameter(entry),

    removeEntry: (parameterName) => {
      if (!get().document) return; // nothing to remove
      runCommand(new RemoveEntryCommand(parameterName, get, set));
    },

    setStochasticSettings: (settings) =>
      runCommand(new SetStochasticSettingsCommand(settings, get, set)),

    setScenarioFilepath: (filepath) =>
      runCommand(new SetScenarioFilepathCommand(filepath, get, set)),

    loadDocument: (doc) => {
      // Loading replaces the document wholesale (single-document semantics, like
      // scenario loadDocument): clear the history and re-baseline the registry —
      // a freshly loaded document is clean.
      commandHistory.clear();
      set({ document: doc });
      useDocumentRegistry.getState().markLoaded('distribution');
    },

    clear: () => {
      commandHistory.clear();
      set({ document: null });
      useDocumentRegistry.getState().markLoaded('distribution');
    },
  };
});
