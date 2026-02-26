/**
 * Zustand store state and action types for the scenario engine.
 */

import type { ScenarioDocument } from '@osce/shared';

export interface ScenarioState {
  document: ScenarioDocument;
  undoAvailable: boolean;
  redoAvailable: boolean;
}
