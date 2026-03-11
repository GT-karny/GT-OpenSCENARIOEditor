import type { Trigger, Condition } from '@osce/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslateFunc = (...args: any[]) => string;

/** Returns a natural-language summary for a single Condition using i18n. */
export function getConditionNaturalSummary(condition: Condition, t: TranslateFunc): string {
  const { condition: inner } = condition;

  if (inner.kind === 'byValue') {
    const vc = inner.valueCondition;
    switch (vc.type) {
      case 'simulationTime':
        return t('composer:trigger.simulationTime', { value: vc.value });
      case 'storyboardElementState':
        return t('composer:trigger.storyboardElementState', {
          ref: vc.storyboardElementRef,
          state: vc.state,
        });
      case 'parameter':
        return t('composer:trigger.parameter', {
          ref: vc.parameterRef,
          rule: vc.rule,
          value: vc.value,
        });
      case 'variable':
        return t('composer:trigger.variable', {
          ref: vc.variableRef,
          rule: vc.rule,
          value: vc.value,
        });
      default:
        return vc.type;
    }
  }

  if (inner.kind === 'byEntity') {
    const ec = inner.entityCondition;
    switch (ec.type) {
      case 'distance':
        return t('composer:trigger.distance', { value: ec.value });
      case 'relativeDistance':
        return t('composer:trigger.relativeDistance', {
          value: ec.value,
          entityRef: ec.entityRef,
        });
      case 'timeHeadway':
        return t('composer:trigger.timeHeadway', { rule: ec.rule, value: ec.value });
      case 'timeToCollision':
        return t('composer:trigger.timeToCollision', { rule: ec.rule, value: ec.value });
      case 'speed':
        return t('composer:trigger.speed', { rule: ec.rule, value: ec.value });
      case 'relativeSpeed':
        return t('composer:trigger.relativeSpeed', { rule: ec.rule, value: ec.value });
      case 'reachPosition':
        return t('composer:trigger.reachPosition');
      case 'standStill':
        return t('composer:trigger.standStill', { duration: ec.duration });
      case 'traveledDistance':
        return t('composer:trigger.traveledDistance', { value: ec.value });
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
export function getNaturalTriggerSummary(trigger: Trigger, t: TranslateFunc): string {
  const firstCondition = trigger.conditionGroups[0]?.conditions[0];
  if (!firstCondition) return t('composer:trigger.immediate');
  return getConditionNaturalSummary(firstCondition, t);
}

/** Returns a short human-readable label for a single Condition. */
export function getConditionShortSummary(condition: Condition): string {
  const { condition: inner } = condition;

  if (inner.kind === 'byValue') {
    const vc = inner.valueCondition;
    switch (vc.type) {
      case 'simulationTime': return `t ≥ ${vc.value}s`;
      case 'storyboardElementState': return `${vc.storyboardElementRef} ${vc.state}`;
      case 'parameter': return `${vc.parameterRef} ${vc.rule} ${vc.value}`;
      case 'variable': return `${vc.variableRef} ${vc.rule} ${vc.value}`;
      default: return vc.type;
    }
  }

  if (inner.kind === 'byEntity') {
    const ec = inner.entityCondition;
    switch (ec.type) {
      case 'distance': return `dist ${ec.rule} ${ec.value}m`;
      case 'relativeDistance': return `near ${ec.entityRef}`;
      case 'timeHeadway': return `THW ${ec.rule} ${ec.value}s`;
      case 'timeToCollision': return `TTC ${ec.rule} ${ec.value}s`;
      case 'speed': return `speed ${ec.rule} ${ec.value}`;
      case 'relativeSpeed': return `rel.speed ${ec.rule} ${ec.value}`;
      case 'reachPosition': return 'reach position';
      case 'standStill': return `stand ${ec.duration}s`;
      case 'traveledDistance': return `dist ${ec.value}m`;
      case 'collision': return 'collision';
      case 'endOfRoad': return 'end of road';
      default: return ec.type;
    }
  }

  return 'trigger';
}

/** Returns a short human-readable label for a Trigger. */
export function getTriggerSummary(trigger: Trigger): string {
  const firstCondition = trigger.conditionGroups[0]?.conditions[0];
  if (!firstCondition) return 'Immediate';
  return getConditionShortSummary(firstCondition);
}
