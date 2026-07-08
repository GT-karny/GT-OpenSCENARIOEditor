/**
 * Default values for each action type.
 * Returns a minimal valid inner action object for use when switching action types.
 * Only required fields are set; optional fields are omitted.
 */

import type {
  PrivateAction,
  GlobalAction,
  UserDefinedAction,
  ScenarioActionType,
} from '@osce/shared';
import { SCENARIO_ACTION_TYPES } from '@osce/shared';

/**
 * Minimal valid inner action for a given discriminator, e.g. when switching an
 * action's type in the editor. Accepts a raw `string` because call sites read
 * the value from `<Select>` handlers (widened to string); an unknown value is
 * rejected instead of silently defaulting. Delegates to {@link buildActionDefault},
 * whose switch is compile-time exhaustive over {@link ScenarioActionType}.
 */
export function defaultActionByType(
  type: string,
): PrivateAction | GlobalAction | UserDefinedAction {
  if (!(SCENARIO_ACTION_TYPES as readonly string[]).includes(type)) {
    throw new Error(`defaultActionByType: unknown action type "${type}"`);
  }
  return buildActionDefault(type as ScenarioActionType);
}

function buildActionDefault(
  type: ScenarioActionType,
): PrivateAction | GlobalAction | UserDefinedAction {
  switch (type) {
    // --- Private: Longitudinal ---
    case 'speedAction':
      return {
        type: 'speedAction',
        dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
        target: { kind: 'absolute', value: 0 },
      };
    case 'speedProfileAction':
      return {
        type: 'speedProfileAction',
        followingMode: 'position',
        entries: [],
      };
    case 'longitudinalDistanceAction':
      return {
        type: 'longitudinalDistanceAction',
        entityRef: '',
        freespace: false,
        continuous: false,
      };

    // --- Private: Lateral ---
    case 'laneChangeAction':
      return {
        type: 'laneChangeAction',
        dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
        target: { kind: 'absolute', value: 0 },
      };
    case 'laneOffsetAction':
      return {
        type: 'laneOffsetAction',
        continuous: false,
        dynamics: {},
        target: { kind: 'absolute', value: 0 },
      };
    case 'lateralDistanceAction':
      return {
        type: 'lateralDistanceAction',
        entityRef: '',
        freespace: false,
        continuous: false,
      };

    // --- Private: Teleport / Routing ---
    case 'teleportAction':
      return {
        type: 'teleportAction',
        position: { type: 'worldPosition', x: 0, y: 0 },
      };
    case 'acquirePositionAction':
      return {
        type: 'acquirePositionAction',
        position: { type: 'worldPosition', x: 0, y: 0 },
      };
    case 'routingAction':
      return {
        type: 'routingAction',
        routeAction: 'acquirePosition',
        position: { type: 'worldPosition', x: 0, y: 0 },
      };
    case 'synchronizeAction':
      return {
        type: 'synchronizeAction',
        masterEntityRef: '',
        targetPositionMaster: { type: 'worldPosition', x: 0, y: 0 },
        targetPosition: { type: 'worldPosition', x: 0, y: 0 },
      };
    case 'followTrajectoryAction':
      return {
        type: 'followTrajectoryAction',
        trajectory: { name: '', closed: false, shape: { type: 'polyline', vertices: [] } },
        timeReference: { none: true },
        followingMode: 'position',
      };

    // --- Private: Controller ---
    case 'assignControllerAction':
      return { type: 'assignControllerAction' };
    case 'activateControllerAction':
      return { type: 'activateControllerAction' };
    case 'overrideControllerAction':
      return { type: 'overrideControllerAction' };

    // --- Private: Appearance / Animation ---
    case 'visibilityAction':
      return { type: 'visibilityAction', graphics: true, traffic: true, sensors: true };
    case 'appearanceAction':
      // XSD AppearanceAction is a choice (LightStateAction | AnimationAction), so
      // an empty <AppearanceAction/> is schema-invalid. AnimationAction with a
      // minimal UserDefinedAnimation (userDefinedAnimationType required) is the
      // smallest valid member. AppearanceAction is a passthrough placeholder in the
      // model (keys are XSD element names / @_ attributes); a proper typed model is
      // future work.
      return {
        type: 'appearanceAction',
        AnimationAction: {
          AnimationType: { UserDefinedAnimation: { '@_userDefinedAnimationType': '' } },
        },
      };
    case 'animationAction':
      return { type: 'animationAction', animationType: '' };
    case 'lightStateAction':
      return { type: 'lightStateAction', lightType: '', mode: 'off' };

    // --- Private: Trailer ---
    case 'connectTrailerAction':
      return { type: 'connectTrailerAction', trailerRef: '' };
    case 'disconnectTrailerAction':
      return { type: 'disconnectTrailerAction' };

    // --- Global ---
    case 'environmentAction':
      return {
        type: 'environmentAction',
        environment: {
          name: '',
          timeOfDay: { animation: false, dateTime: '2020-01-01T12:00:00' },
          weather: {},
          roadCondition: { frictionScaleFactor: 1 },
        },
      };
    case 'entityAction':
      // XSD AddEntityAction requires a Position child; without it the serialized
      // <AddEntityAction/> is schema-invalid (and unparseable on round-trip).
      return {
        type: 'entityAction',
        entityRef: '',
        actionType: 'addEntity',
        position: { type: 'worldPosition', x: 0, y: 0 },
      };
    case 'parameterAction':
      // XSD ParameterSetAction requires @value; omitting it yields a schema-invalid
      // empty <SetAction/>.
      return { type: 'parameterAction', parameterRef: '', actionType: 'set', value: '' };
    case 'variableAction':
      // XSD VariableSetAction requires @value (see parameterAction).
      return { type: 'variableAction', variableRef: '', actionType: 'set', value: '' };
    case 'infrastructureAction':
      // XSD TrafficSignalAction is a choice (TrafficSignalControllerAction |
      // TrafficSignalStateAction), so an empty <TrafficSignalAction/> is
      // schema-invalid. TrafficSignalStateAction (name + state required) is the
      // minimal valid member.
      return {
        type: 'infrastructureAction',
        trafficSignalAction: { stateAction: { name: '', state: '' } },
      };
    case 'trafficAction':
      // XSD TrafficAction is a choice of Traffic{Source,Sink,Swarm,Area,Stop}Action,
      // so an empty <TrafficAction/> is schema-invalid. TrafficStopAction is the only
      // empty-content member, so it is the minimal valid default. TrafficAction is a
      // passthrough in the model (keys are XSD element names), so it is carried as a
      // raw key.
      return { type: 'trafficAction', TrafficStopAction: '' };
    case 'setMonitorAction':
      return { type: 'setMonitorAction', monitorRef: '', value: false };

    // --- UserDefined ---
    case 'userDefinedAction':
      return { type: 'userDefinedAction', customCommandAction: '' };

    default: {
      // Exhaustiveness weld: adding a ScenarioActionType member without a case
      // above makes this `never` assignment a compile error. Unreachable at
      // runtime because defaultActionByType rejects non-canonical strings first.
      const _exhaustive: never = type;
      throw new Error(`buildActionDefault: unhandled action type "${_exhaustive}"`);
    }
  }
}
