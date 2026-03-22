/**
 * Zustand store state types for the OpenDRIVE engine.
 */

import type { OpenDriveDocument } from '@osce/shared';

export interface OpenDriveState {
  document: OpenDriveDocument;
  undoAvailable: boolean;
  redoAvailable: boolean;
  dirtyRoadIds: Set<string>;
  dirtyJunctionIds: Set<string>;
}
