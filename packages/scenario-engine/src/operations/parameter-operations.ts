/**
 * Pure helper functions for parameter operations.
 */

import type { ScenarioDocument, ParameterDeclaration } from '@osce/shared';

export function findParameterById(doc: ScenarioDocument, paramId: string): ParameterDeclaration | undefined {
  return doc.parameterDeclarations.find((p) => p.id === paramId);
}

export function findParameterIndex(doc: ScenarioDocument, paramId: string): number {
  return doc.parameterDeclarations.findIndex((p) => p.id === paramId);
}
