/**
 * Human-readable display strings for condition types.
 */

import type { Condition, Trigger } from '@osce/shared';

const conditionTypeLabels: Record<string, string> = {
  distance: 'Distance',
  relativeDistance: 'Relative Distance',
  timeHeadway: 'Time Headway',
  timeToCollision: 'Time To Collision',
  acceleration: 'Acceleration',
  speed: 'Speed',
  relativeSpeed: 'Relative Speed',
  reachPosition: 'Reach Position',
  standStill: 'Stand Still',
  traveledDistance: 'Traveled Distance',
  endOfRoad: 'End of Road',
  collision: 'Collision',
  offroad: 'Offroad',
  relativeClearance: 'Relative Clearance',
  simulationTime: 'Simulation Time',
  storyboardElementState: 'Element State',
  parameter: 'Parameter',
  variable: 'Variable',
  trafficSignal: 'Traffic Signal',
  trafficSignalController: 'Signal Controller',
  userDefinedValue: 'User Defined',
};

export function getConditionTypeLabel(conditionType: string): string {
  return conditionTypeLabels[conditionType] ?? conditionType;
}

export function getConditionSummary(condition: Condition): string {
  const c = condition.condition;
  if (c.kind === 'byValue') {
    const vc = c.valueCondition;
    switch (vc.type) {
      case 'simulationTime':
        return `SimTime ${vc.rule} ${vc.value}s`;
      case 'storyboardElementState':
        return `${vc.storyboardElementRef} ${vc.state}`;
      case 'parameter':
        return `Param ${vc.parameterRef} ${vc.rule} ${vc.value}`;
      case 'variable':
        return `Var ${vc.variableRef} ${vc.rule} ${vc.value}`;
      case 'trafficSignal':
        return `Signal ${vc.name} = ${vc.state}`;
      case 'trafficSignalController':
        return `Controller ${vc.trafficSignalControllerRef}`;
      case 'userDefinedValue':
        return `Custom ${vc.name} ${vc.rule} ${vc.value}`;
    }
  }
  if (c.kind === 'byEntity') {
    const ec = c.entityCondition;
    switch (ec.type) {
      case 'distance':
        return `Distance ${ec.rule} ${ec.value}m`;
      case 'relativeDistance':
        return `RelDist to ${ec.entityRef} ${ec.rule} ${ec.value}m`;
      case 'timeHeadway':
        return `Headway to ${ec.entityRef} ${ec.rule} ${ec.value}s`;
      case 'timeToCollision':
        return `TTC ${ec.rule} ${ec.value}s`;
      case 'acceleration':
        return `Accel ${ec.rule} ${ec.value}`;
      case 'speed':
        return `Speed ${ec.rule} ${ec.value} m/s`;
      case 'relativeSpeed':
        return `RelSpeed to ${ec.entityRef} ${ec.rule} ${ec.value}`;
      case 'reachPosition':
        return `Reach pos (tol: ${ec.tolerance}m)`;
      case 'standStill':
        return `StandStill ${ec.duration}s`;
      case 'traveledDistance':
        return `Traveled ${ec.value}m`;
      case 'endOfRoad':
        return `End of road ${ec.duration}s`;
      case 'collision':
        return `Collision ${ec.target.kind === 'entity' ? ec.target.entityRef : ec.target.objectType}`;
      case 'offroad':
        return `Offroad ${ec.duration}s`;
      case 'relativeClearance':
        return 'Relative Clearance';
    }
  }
  return 'Unknown';
}

export function getTriggerSummary(trigger: Trigger): string {
  if (trigger.conditionGroups.length === 0) return 'No conditions';
  const allConditions = trigger.conditionGroups.flatMap((g) => g.conditions);
  if (allConditions.length === 0) return 'Empty trigger';
  if (allConditions.length === 1) return getConditionSummary(allConditions[0]);
  return `${allConditions.length} conditions`;
}
