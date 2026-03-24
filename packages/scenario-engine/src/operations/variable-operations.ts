/**
 * Pure helper functions for variable operations.
 */

import type { ScenarioDocument, VariableDeclaration } from '@osce/shared';

export function findVariableById(doc: ScenarioDocument, varId: string): VariableDeclaration | undefined {
  return doc.variableDeclarations.find((v) => v.id === varId);
}

export function findVariableIndex(doc: ScenarioDocument, varId: string): number {
  return doc.variableDeclarations.findIndex((v) => v.id === varId);
}
