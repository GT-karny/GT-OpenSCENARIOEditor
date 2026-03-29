import type { ScenarioAction } from '@osce/shared';
import { resolveBindingDisplay } from '../../lib/expression-utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslateFunc = (...args: any[]) => string;

type Bindings = Record<string, Record<string, string>>;

/** Returns a short human-readable label for an Action. */
export function getActionSummary(action: ScenarioAction, bindings?: Bindings): string {
  const a = action.action;
  const eb = bindings?.[action.id];
  const v = (val: number | string | undefined | null, field: string) =>
    resolveBindingDisplay(val, field, eb);

  switch (a.type) {
    // --- Private: Longitudinal ---
    case 'speedAction': {
      const t = a.target;
      if (t.kind === 'absolute') return `Speed → ${v(t.value, 'action.target.value')} m/s`;
      return `Speed → ${v(t.value, 'action.target.value')} (rel ${t.entityRef})`;
    }
    case 'speedProfileAction':
      return `SpeedProfile (${a.entries.length} pts)`;
    case 'longitudinalDistanceAction':
      if (a.timeGap != null) return `Follow ${a.entityRef} (${v(a.timeGap, 'action.timeGap')}s gap)`;
      if (a.distance != null) return `Follow ${a.entityRef} (${v(a.distance, 'action.distance')}m)`;
      return `Follow ${a.entityRef}`;

    // --- Private: Lateral ---
    case 'laneChangeAction': {
      const t = a.target;
      if (t.kind === 'absolute') return `LaneChange → ${v(t.value, 'action.target.value')}`;
      return `LaneChange ${v(t.value, 'action.target.value')} (rel ${t.entityRef})`;
    }
    case 'laneOffsetAction': {
      const t = a.target;
      if (t.kind === 'absolute') return `LaneOffset → ${v(t.value, 'action.target.value')}m`;
      return `LaneOffset ${v(t.value, 'action.target.value')}m (rel ${t.entityRef})`;
    }
    case 'lateralDistanceAction':
      return `LatDist → ${a.entityRef}${a.distance != null ? ` ${v(a.distance, 'action.distance')}m` : ''}`;

    // --- Private: Position ---
    case 'teleportAction':
      return `Teleport`;
    case 'synchronizeAction':
      return `Sync with ${a.masterEntityRef}`;
    case 'followTrajectoryAction':
      return `Follow trajectory "${a.trajectory.name}"`;
    case 'acquirePositionAction':
      return `Acquire position`;

    // --- Private: Routing ---
    case 'routingAction':
      return `Route: ${a.routeAction}`;

    // --- Private: Controller ---
    case 'assignControllerAction':
      return `Assign controller${a.controller ? ` "${a.controller.name}"` : ''}`;
    case 'activateControllerAction':
      return `Activate controller`;
    case 'overrideControllerAction':
      return `Override controller`;

    // --- Private: Visual ---
    case 'visibilityAction':
      return `Visibility`;
    case 'appearanceAction':
      return `Appearance`;
    case 'animationAction':
      return `Animation: ${a.animationType}`;
    case 'lightStateAction':
      return `Light ${a.lightType} ${a.mode}`;

    // --- Private: Trailer ---
    case 'connectTrailerAction':
      return `Connect trailer ${a.trailerRef}`;
    case 'disconnectTrailerAction':
      return `Disconnect trailer`;

    // --- Global ---
    case 'environmentAction':
      return `Environment "${a.environment.name}"`;
    case 'entityAction':
      return `${a.actionType === 'addEntity' ? 'Add' : 'Delete'} ${a.entityRef}`;
    case 'parameterAction':
      return `Param ${a.parameterRef} = ${v(a.value ?? a.modifyValue, 'action.value')}`;
    case 'variableAction':
      return `Var ${a.variableRef} = ${v(a.value ?? a.modifyValue, 'action.value')}`;
    case 'infrastructureAction':
      return `Traffic signal`;
    case 'trafficAction':
      return `Traffic`;

    // --- User Defined ---
    case 'userDefinedAction':
      return `Custom: ${a.customCommandAction}`;

    default:
      return 'Unknown action';
  }
}

/** Returns a short type label for an action (no parameters). */
export function getActionTypeLabel(action: ScenarioAction): string {
  const typeLabels: Record<string, string> = {
    speedAction: 'Speed',
    speedProfileAction: 'Speed Profile',
    laneChangeAction: 'Lane Change',
    laneOffsetAction: 'Lane Offset',
    lateralDistanceAction: 'Lateral Distance',
    longitudinalDistanceAction: 'Follow Distance',
    teleportAction: 'Teleport',
    synchronizeAction: 'Synchronize',
    followTrajectoryAction: 'Follow Trajectory',
    acquirePositionAction: 'Acquire Position',
    routingAction: 'Routing',
    assignControllerAction: 'Assign Controller',
    activateControllerAction: 'Activate Controller',
    overrideControllerAction: 'Override Controller',
    visibilityAction: 'Visibility',
    appearanceAction: 'Appearance',
    animationAction: 'Animation',
    lightStateAction: 'Light State',
    connectTrailerAction: 'Connect Trailer',
    disconnectTrailerAction: 'Disconnect Trailer',
    environmentAction: 'Environment',
    entityAction: 'Entity',
    parameterAction: 'Parameter',
    variableAction: 'Variable',
    infrastructureAction: 'Infrastructure',
    trafficAction: 'Traffic',
    userDefinedAction: 'User Defined',
  };
  return typeLabels[action.action.type] ?? action.action.type;
}

/** Returns a short i18n-aware label for an action type (for collapsed-state tags). */
export function getActionShortLabel(action: ScenarioAction, t: TranslateFunc): string {
  const key = `composer:action.${action.action.type}`;
  const result = t(key);
  // Fall back to English type label if i18n key not found
  return result === key ? getActionTypeLabel(action) : result;
}
