/**
 * Typed updater helpers for the property editors.
 *
 * Property editors operate on a single discriminated-union member (a concrete
 * action or entity/value condition) but must hand the store a partial of the
 * wrapping type (`ScenarioAction` / `Condition`). Historically this was bridged
 * with unchecked partial-type assertions at every call site, which silenced the
 * compiler even when the inner shape was wrong.
 *
 * These helpers express the same merge generically: the union member type `T`
 * is proven to extend the wrapper's member field, so building the wrapper
 * partial is sound and needs no cast at the call site.
 *
 * This module is UI-local on purpose — `@osce/shared` stays types-only, so
 * runtime merge helpers live next to the editors that use them.
 */

import type {
  ScenarioAction,
  Condition,
  ByEntityCondition,
  ByValueCondition,
  EntityCondition,
  ValueCondition,
} from '@osce/shared';

/** The discriminated union of every concrete action body. */
type ActionBody = ScenarioAction['action'];

/**
 * Replace an action body wholesale, returning a `Partial<ScenarioAction>`.
 *
 * Useful when an editor (or a type/category switch) produces a brand-new body
 * rather than patching the current one.
 */
export function actionReplace(body: ActionBody): Partial<ScenarioAction> {
  return { action: body };
}

/**
 * Merge `updates` onto an action body and wrap it as a `Partial<ScenarioAction>`.
 *
 * `T` is the concrete union member, so `{ ...inner, ...updates }` is `T` and
 * assigning it to `action` is sound without a cast.
 */
export function actionUpdate<T extends ActionBody>(
  inner: T,
  updates: Partial<T>,
): Partial<ScenarioAction> {
  return { action: { ...inner, ...updates } };
}

/**
 * Wrap an already-derived action body (e.g. the `...rest` of a destructure that
 * removed an optional field) as a `Partial<ScenarioAction>`.
 *
 * Same as {@link actionReplace} but named for the "I built the body myself"
 * call sites so intent stays readable.
 */
export function actionBody<T extends ActionBody>(body: T): Partial<ScenarioAction> {
  return { action: body };
}

/** Narrow a condition body to its `byEntity` variant. */
export function isByEntity(condition: Condition): condition is Condition & {
  condition: ByEntityCondition;
} {
  return condition.condition.kind === 'byEntity';
}

/** Narrow a condition body to its `byValue` variant. */
export function isByValue(condition: Condition): condition is Condition & {
  condition: ByValueCondition;
} {
  return condition.condition.kind === 'byValue';
}

/**
 * Replace a condition body (`ByEntityCondition | ByValueCondition`) wholesale,
 * returning a `Partial<Condition>`. Used by type/category switches.
 */
export function conditionReplace(
  body: ByEntityCondition | ByValueCondition,
): Partial<Condition> {
  return { condition: body };
}

/**
 * Merge `updates` onto the `entityCondition` of a `ByEntityCondition`, keeping
 * the surrounding `triggeringEntities` untouched, and wrap as
 * `Partial<Condition>`.
 */
export function entityConditionUpdate<T extends EntityCondition>(
  inner: ByEntityCondition,
  cond: T,
  updates: Partial<T>,
): Partial<Condition> {
  return { condition: { ...inner, entityCondition: { ...cond, ...updates } } };
}

/**
 * Replace the `entityCondition` of a `ByEntityCondition` with an
 * already-derived body (e.g. a `...rest` destructure), wrapped as
 * `Partial<Condition>`.
 */
export function entityConditionReplace<T extends EntityCondition>(
  inner: ByEntityCondition,
  cond: T,
): Partial<Condition> {
  return { condition: { ...inner, entityCondition: cond } };
}

/**
 * Merge `updates` onto the `valueCondition` of a `ByValueCondition`, wrapped as
 * `Partial<Condition>`.
 */
export function valueConditionUpdate<T extends ValueCondition>(
  inner: ByValueCondition,
  cond: T,
  updates: Partial<T>,
): Partial<Condition> {
  return { condition: { ...inner, valueCondition: { ...cond, ...updates } } };
}

/**
 * Replace the `valueCondition` of a `ByValueCondition` with an already-derived
 * body, wrapped as `Partial<Condition>`.
 */
export function valueConditionReplace<T extends ValueCondition>(
  inner: ByValueCondition,
  cond: T,
): Partial<Condition> {
  return { condition: { ...inner, valueCondition: cond } };
}

/**
 * Patch the `triggeringEntities` of a `ByEntityCondition`, wrapped as
 * `Partial<Condition>`.
 */
export function triggeringEntitiesUpdate(
  inner: ByEntityCondition,
  updates: Partial<ByEntityCondition['triggeringEntities']>,
): Partial<Condition> {
  return {
    condition: {
      ...inner,
      triggeringEntities: { ...inner.triggeringEntities, ...updates },
    },
  };
}
