/**
 * Human-readable display strings for condition types.
 */

import type { Condition, Trigger } from '@osce/shared';

type Bindings = Record<string, Record<string, string>>;
type ElementBindings = Record<string, string> | undefined;

function rv(value: number | string | undefined | null, field: string, eb: ElementBindings): string {
  const binding = eb?.[field];
  if (binding) {
    return binding.startsWith('${') && binding.endsWith('}') ? binding.slice(2, -1) : binding;
  }
  return String(value ?? '');
}

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

export function getConditionSummary(condition: Condition, bindings?: Bindings): string {
  const c = condition.condition;
  const eb = bindings?.[condition.id];
  const v = (val: number | string | undefined | null, field: string) => rv(val, field, eb);

  if (c.kind === 'byValue') {
    const vc = c.valueCondition;
    switch (vc.type) {
      case 'simulationTime':
        return `SimTime ${vc.rule} ${v(vc.value, 'value')}s`;
      case 'storyboardElementState':
        return `${vc.storyboardElementRef} ${vc.state}`;
      case 'parameter':
        return `Param ${vc.parameterRef} ${vc.rule} ${v(vc.value, 'value')}`;
      case 'variable':
        return `Var ${vc.variableRef} ${vc.rule} ${v(vc.value, 'value')}`;
      case 'trafficSignal':
        return `Signal ${vc.name} = ${vc.state}`;
      case 'trafficSignalController':
        return `Controller ${vc.trafficSignalControllerRef}`;
      case 'userDefinedValue':
        return `Custom ${vc.name} ${vc.rule} ${v(vc.value, 'value')}`;
    }
  }
  if (c.kind === 'byEntity') {
    const ec = c.entityCondition;
    switch (ec.type) {
      case 'distance':
        return `Distance ${ec.rule} ${v(ec.value, 'value')}m`;
      case 'relativeDistance':
        return `RelDist to ${ec.entityRef} ${ec.rule} ${v(ec.value, 'value')}m`;
      case 'timeHeadway':
        return `Headway to ${ec.entityRef} ${ec.rule} ${v(ec.value, 'value')}s`;
      case 'timeToCollision':
        return `TTC ${ec.rule} ${v(ec.value, 'value')}s`;
      case 'acceleration':
        return `Accel ${ec.rule} ${v(ec.value, 'value')}`;
      case 'speed':
        return `Speed ${ec.rule} ${v(ec.value, 'value')} m/s`;
      case 'relativeSpeed':
        return `RelSpeed to ${ec.entityRef} ${ec.rule} ${v(ec.value, 'value')}`;
      case 'reachPosition':
        return `Reach pos (tol: ${v(ec.tolerance, 'tolerance')}m)`;
      case 'standStill':
        return `StandStill ${v(ec.duration, 'duration')}s`;
      case 'traveledDistance':
        return `Traveled ${v(ec.value, 'value')}m`;
      case 'endOfRoad':
        return `End of road ${v(ec.duration, 'duration')}s`;
      case 'collision':
        return `Collision ${ec.target.kind === 'entity' ? ec.target.entityRef : ec.target.objectType}`;
      case 'offroad':
        return `Offroad ${v(ec.duration, 'duration')}s`;
      case 'relativeClearance':
        return 'Relative Clearance';
    }
  }
  return 'Unknown';
}

export function getTriggerSummary(trigger: Trigger, bindings?: Bindings): string {
  if (trigger.conditionGroups.length === 0) return 'No conditions';
  const allConditions = trigger.conditionGroups.flatMap((g) => g.conditions);
  if (allConditions.length === 0) return 'Empty trigger';
  if (allConditions.length === 1) return getConditionSummary(allConditions[0], bindings);
  return `${allConditions.length} conditions`;
}
