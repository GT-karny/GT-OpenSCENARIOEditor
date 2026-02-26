/**
 * Pure helper functions for entity operations.
 */

import type { ScenarioDocument, ScenarioEntity } from '@osce/shared';

export function findEntityById(doc: ScenarioDocument, entityId: string): ScenarioEntity | undefined {
  return doc.entities.find((e) => e.id === entityId);
}

export function findEntityIndex(doc: ScenarioDocument, entityId: string): number {
  return doc.entities.findIndex((e) => e.id === entityId);
}
