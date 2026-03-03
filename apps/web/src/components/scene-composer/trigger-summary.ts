import type { Trigger } from '@osce/shared';

/** Returns a short human-readable label for a Trigger. */
export function getTriggerSummary(trigger: Trigger): string {
  const firstCondition = trigger.conditionGroups[0]?.conditions[0];
  if (!firstCondition) return 'Immediate';

  const { condition } = firstCondition;

  if (condition.kind === 'byValue') {
    const vc = condition.valueCondition;
    switch (vc.type) {
      case 'simulationTime': return `t ≥ ${vc.value}s`;
      case 'storyboardElementState': return `${vc.storyboardElementRef} ${vc.state}`;
      case 'parameter': return `${vc.parameterRef} ${vc.rule} ${vc.value}`;
      case 'variable': return `${vc.variableRef} ${vc.rule} ${vc.value}`;
      default: return vc.type;
    }
  }

  if (condition.kind === 'byEntity') {
    const ec = condition.entityCondition;
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
