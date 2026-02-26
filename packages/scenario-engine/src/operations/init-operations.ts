/**
 * Pure helper functions for Init operations.
 */

import type {
  ScenarioDocument,
  EntityInitActions,
  InitPrivateAction,
} from '@osce/shared';

export function findEntityInitActions(
  doc: ScenarioDocument,
  entityName: string,
): EntityInitActions | undefined {
  return doc.storyboard.init.entityActions.find((ea) => ea.entityRef === entityName);
}

export function findEntityInitActionsIndex(
  doc: ScenarioDocument,
  entityName: string,
): number {
  return doc.storyboard.init.entityActions.findIndex((ea) => ea.entityRef === entityName);
}

export function findInitActionById(
  doc: ScenarioDocument,
  actionId: string,
): { entityActions: EntityInitActions; initAction: InitPrivateAction; actionIndex: number } | undefined {
  for (const ea of doc.storyboard.init.entityActions) {
    const actionIndex = ea.privateActions.findIndex((pa) => pa.id === actionId);
    if (actionIndex !== -1) {
      return { entityActions: ea, initAction: ea.privateActions[actionIndex], actionIndex };
    }
  }
  return undefined;
}
