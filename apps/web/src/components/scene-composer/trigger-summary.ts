import type { Trigger, Condition } from '@osce/shared';
import { resolveBindingDisplay } from '../../lib/expression-utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslateFunc = (...args: any[]) => string;

type Bindings = Record<string, Record<string, string>>;

/** Returns a natural-language summary for a single Condition using i18n. */
export function getConditionNaturalSummary(condition: Condition, t: TranslateFunc, bindings?: Bindings): string {
  const { condition: inner } = condition;
  const eb = bindings?.[condition.id];
  const v = (val: number | string | undefined | null, field: string) =>
    resolveBindingDisplay(val, field, eb);

  if (inner.kind === 'byValue') {
    const vc = inner.valueCondition;
    switch (vc.type) {
      case 'simulationTime':
        return t('composer:trigger.simulationTime', { value: v(vc.value, 'value') });
      case 'storyboardElementState':
        return t('composer:trigger.storyboardElementState', {
          ref: vc.storyboardElementRef,
          state: vc.state,
        });
      case 'parameter':
        return t('composer:trigger.parameter', {
          ref: vc.parameterRef,
          rule: vc.rule,
          value: v(vc.value, 'value'),
        });
      case 'variable':
        return t('composer:trigger.variable', {
          ref: vc.variableRef,
          rule: vc.rule,
          value: v(vc.value, 'value'),
        });
      default:
        return vc.type;
    }
  }

  if (inner.kind === 'byEntity') {
    const ec = inner.entityCondition;
    switch (ec.type) {
      case 'distance':
        return t('composer:trigger.distance', { value: v(ec.value, 'value') });
      case 'relativeDistance':
        return t('composer:trigger.relativeDistance', {
          value: v(ec.value, 'value'),
          entityRef: ec.entityRef,
        });
      case 'timeHeadway':
        return t('composer:trigger.timeHeadway', { rule: ec.rule, value: v(ec.value, 'value') });
      case 'timeToCollision':
        return t('composer:trigger.timeToCollision', { rule: ec.rule, value: v(ec.value, 'value') });
      case 'speed':
        return t('composer:trigger.speed', { rule: ec.rule, value: v(ec.value, 'value') });
      case 'relativeSpeed':
        return t('composer:trigger.relativeSpeed', { rule: ec.rule, value: v(ec.value, 'value') });
      case 'reachPosition':
        return t('composer:trigger.reachPosition');
      case 'standStill':
        return t('composer:trigger.standStill', { duration: v(ec.duration, 'duration') });
      case 'traveledDistance':
        return t('composer:trigger.traveledDistance', { value: v(ec.value, 'value') });
      case 'collision':
        return t('composer:trigger.collision');
      case 'endOfRoad':
        return t('composer:trigger.endOfRoad');
      default:
        return ec.type;
    }
  }

  return t('composer:trigger.immediate');
}

/** Returns a natural-language trigger summary using i18n. */
export function getNaturalTriggerSummary(trigger: Trigger, t: TranslateFunc, bindings?: Bindings): string {
  const firstCondition = trigger.conditionGroups[0]?.conditions[0];
  if (!firstCondition) return t('composer:trigger.immediate');
  return getConditionNaturalSummary(firstCondition, t, bindings);
}

/** Returns a short human-readable label for a single Condition. */
export function getConditionShortSummary(condition: Condition, bindings?: Bindings): string {
  const { condition: inner } = condition;
  const eb = bindings?.[condition.id];
  const v = (val: number | string | undefined | null, field: string) =>
    resolveBindingDisplay(val, field, eb);

  if (inner.kind === 'byValue') {
    const vc = inner.valueCondition;
    switch (vc.type) {
      case 'simulationTime': return `t ≥ ${v(vc.value, 'value')}s`;
      case 'storyboardElementState': return `${vc.storyboardElementRef} ${vc.state}`;
      case 'parameter': return `${vc.parameterRef} ${vc.rule} ${v(vc.value, 'value')}`;
      case 'variable': return `${vc.variableRef} ${vc.rule} ${v(vc.value, 'value')}`;
      default: return vc.type;
    }
  }

  if (inner.kind === 'byEntity') {
    const ec = inner.entityCondition;
    switch (ec.type) {
      case 'distance': return `dist ${ec.rule} ${v(ec.value, 'value')}m`;
      case 'relativeDistance': return `near ${ec.entityRef}`;
      case 'timeHeadway': return `THW ${ec.rule} ${v(ec.value, 'value')}s`;
      case 'timeToCollision': return `TTC ${ec.rule} ${v(ec.value, 'value')}s`;
      case 'speed': return `speed ${ec.rule} ${v(ec.value, 'value')}`;
      case 'relativeSpeed': return `rel.speed ${ec.rule} ${v(ec.value, 'value')}`;
      case 'reachPosition': return 'reach position';
      case 'standStill': return `stand ${v(ec.duration, 'duration')}s`;
      case 'traveledDistance': return `dist ${v(ec.value, 'value')}m`;
      case 'collision': return 'collision';
      case 'endOfRoad': return 'end of road';
      default: return ec.type;
    }
  }

  return 'trigger';
}

/** Returns a short human-readable label for a Trigger. */
export function getTriggerSummary(trigger: Trigger, bindings?: Bindings): string {
  const firstCondition = trigger.conditionGroups[0]?.conditions[0];
  if (!firstCondition) return 'Immediate';
  return getConditionShortSummary(firstCondition, bindings);
}
