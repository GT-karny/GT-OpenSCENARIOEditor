/**
 * Component engine for UseCaseComponent decompose/reconcile orchestration.
 */

import type {
  UseCaseComponent,
  DecompositionContext,
  DecompositionResult,
  ReconciliationContext,
  IScenarioService,
} from '@osce/shared';

/**
 * Apply a UseCaseComponent to the scenario by decomposing it
 * into entities, init actions, and stories, then adding them via the store.
 */
export function applyUseCaseComponent(
  store: IScenarioService,
  component: UseCaseComponent,
  params: Record<string, unknown>,
  context: DecompositionContext,
): DecompositionResult {
  const result = component.decompose(params, context);

  // Add entities
  for (const entityPartial of result.entities) {
    store.addEntity(entityPartial);
  }

  // Add init actions
  for (const initGroup of result.initActions) {
    for (const action of initGroup.actions) {
      store.addInitAction(initGroup.entityName, action);
    }
  }

  // Add stories
  for (const storyPartial of result.stories) {
    store.addStory(storyPartial);
  }

  return result;
}

/**
 * Reconcile component parameters after external changes.
 */
export function reconcileComponent(
  component: UseCaseComponent,
  params: Record<string, unknown>,
  context: ReconciliationContext,
): Record<string, unknown> {
  return component.reconcile(params, context);
}
