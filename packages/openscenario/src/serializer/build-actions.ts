import type {
  PrivateAction,
  GlobalAction,
  UserDefinedAction,
  TransitionDynamics,
  DynamicConstraints,
  FinalSpeed,
  Trajectory,
  TimeReference,
  OverrideValue,
  OverrideGearValue,
  SpeedTarget,
  LaneChangeTarget,
  LaneOffsetTarget,
  LaneOffsetDynamics,
  Environment,
  Weather,
  TrafficSignalAction,
  Position,
} from '@osce/shared';
import type { ParameterDeclaration } from '@osce/shared';
import { buildPosition, buildPositionWrapped } from './build-positions.js';
import { buildParameterDeclarations } from './build-parameters.js';
import { buildAttrs, getSubBindings } from '../utils/xml-helpers.js';

// ─── Private Action ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPrivateAction(action: PrivateAction, elementBindings: Record<string, string> = {}): Record<string, any> {
  switch (action.type) {
    case 'speedAction':
      return {
        LongitudinalAction: {
          SpeedAction: {
            SpeedActionDynamics: buildTransitionDynamics(action.dynamics, getSubBindings(elementBindings, 'dynamics')),
            SpeedActionTarget: buildSpeedTarget(action.target, getSubBindings(elementBindings, 'target')),
          },
        },
      };

    case 'speedProfileAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spa: any = buildAttrs({
        entityRef: action.entityRef,
        followingMode: action.followingMode,
      }, elementBindings);
      if (action.dynamicsDimension !== undefined) {
        spa.DynamicsDimension = buildAttrs({ dynamicsDimension: action.dynamicsDimension });
      }
      spa.SpeedProfileEntry = action.entries.map((e) =>
        buildAttrs({ speed: e.speed, time: e.time }),
      );
      return { LongitudinalAction: { SpeedProfileAction: spa } };
    }

    case 'laneChangeAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lca: any = buildAttrs({ targetLaneOffset: action.targetLaneOffset }, elementBindings);
      lca.LaneChangeActionDynamics = buildTransitionDynamics(action.dynamics, getSubBindings(elementBindings, 'dynamics'));
      lca.LaneChangeTarget = buildLaneChangeTarget(action.target, getSubBindings(elementBindings, 'target'));
      return { LateralAction: { LaneChangeAction: lca } };
    }

    case 'laneOffsetAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loa: any = buildAttrs({ continuous: action.continuous }, elementBindings);
      loa.LaneOffsetActionDynamics = buildLaneOffsetDynamics(action.dynamics, getSubBindings(elementBindings, 'dynamics'));
      loa.LaneOffsetTarget = buildLaneOffsetTarget(action.target, getSubBindings(elementBindings, 'target'));
      return { LateralAction: { LaneOffsetAction: loa } };
    }

    case 'lateralDistanceAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lda: any = buildAttrs({
        entityRef: action.entityRef,
        distance: action.distance,
        freespace: action.freespace,
        continuous: action.continuous,
        coordinateSystem: action.coordinateSystem,
        displacement: action.displacement,
      }, elementBindings);
      if (action.dynamics) {
        lda.DynamicConstraints = buildDynamicConstraints(action.dynamics, getSubBindings(elementBindings, 'dynamics'));
      }
      return { LateralAction: { LateralDistanceAction: lda } };
    }

    case 'longitudinalDistanceAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lda: any = buildAttrs({
        entityRef: action.entityRef,
        distance: action.distance,
        timeGap: action.timeGap,
        freespace: action.freespace,
        continuous: action.continuous,
        coordinateSystem: action.coordinateSystem,
        displacement: action.displacement,
      }, elementBindings);
      if (action.dynamics) {
        lda.DynamicConstraints = buildDynamicConstraints(action.dynamics, getSubBindings(elementBindings, 'dynamics'));
      }
      return { LongitudinalAction: { LongitudinalDistanceAction: lda } };
    }

    case 'teleportAction':
      return {
        TeleportAction: buildPositionWrapped(action.position, getSubBindings(elementBindings, 'position')),
      };

    case 'synchronizeAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sa: any = buildAttrs({
        masterEntityRef: action.masterEntityRef,
        toleranceMaster: action.toleranceMaster,
        tolerance: action.tolerance,
      }, elementBindings);
      // Position content goes DIRECTLY inside TargetPositionMaster/TargetPosition (not wrapped in <Position>)
      sa.TargetPositionMaster = buildPosition(action.targetPositionMaster);
      sa.TargetPosition = buildPosition(action.targetPosition);
      if (action.finalSpeed) {
        sa.FinalSpeed = buildFinalSpeed(action.finalSpeed);
      }
      return { SynchronizeAction: sa };
    }

    case 'followTrajectoryAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fta: any = buildAttrs({
        initialDistanceOffset: action.initialDistanceOffset,
      }, elementBindings);
      fta.Trajectory = buildTrajectory(action.trajectory);
      fta.TimeReference = buildTimeReference(action.timeReference);
      if (action.followingMode) {
        fta.TrajectoryFollowingMode = buildAttrs({ followingMode: action.followingMode });
      }
      return { RoutingAction: { FollowTrajectoryAction: fta } };
    }

    case 'acquirePositionAction':
      return {
        RoutingAction: {
          AcquirePositionAction: buildPositionWrapped(action.position),
        },
      };

    case 'routingAction': {
      switch (action.routeAction) {
        case 'assignRoute': {
          if (action.route) {
            return {
              RoutingAction: {
                AssignRouteAction: {
                  Route: buildRoute(action.route),
                },
              },
            };
          }
          if (action.catalogReference) {
            return {
              RoutingAction: {
                AssignRouteAction: {
                  CatalogReference: buildAttrs({
                    catalogName: action.catalogReference.catalogName,
                    entryName: action.catalogReference.entryName,
                  }),
                },
              },
            };
          }
          return { RoutingAction: { AssignRouteAction: '' } };
        }
        case 'followToConnectingRoad':
          return {
            RoutingAction: {
              FollowToConnectingRoadAction: '',
            },
          };
        case 'acquirePosition': {
          if (action.position) {
            return {
              RoutingAction: {
                AcquirePositionAction: buildPositionWrapped(action.position),
              },
            };
          }
          return { RoutingAction: { AcquirePositionAction: '' } };
        }
      }
      break;
    }

    case 'assignControllerAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aca: any = buildAttrs({
        activateLateral: action.activateLateral,
        activateLongitudinal: action.activateLongitudinal,
        activateAnimation: action.activateAnimation,
        activateLighting: action.activateLighting,
      });
      if (action.controller) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctrl: any = buildAttrs({ name: action.controller.name });
        if (action.controller.properties.length > 0) {
          ctrl.Properties = {
            Property: action.controller.properties.map((p) =>
              buildAttrs({ name: p.name, value: p.value }),
            ),
          };
        }
        aca.Controller = ctrl;
      }
      if (action.catalogReference) {
        aca.CatalogReference = buildAttrs({
          catalogName: action.catalogReference.catalogName,
          entryName: action.catalogReference.entryName,
        });
      }
      return { ControllerAction: { AssignControllerAction: aca } };
    }

    case 'activateControllerAction':
      return {
        ControllerAction: {
          ActivateControllerAction: buildAttrs({
            lateral: action.lateral,
            longitudinal: action.longitudinal,
            animation: action.animation,
            lighting: action.lighting,
            controllerRef: action.controllerRef,
          }),
        },
      };

    case 'overrideControllerAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ocva: any = {};
      if (action.throttle) {
        ocva.Throttle = buildOverrideValue(action.throttle);
      }
      if (action.brake) {
        ocva.Brake = buildOverrideValue(action.brake);
      }
      if (action.clutch) {
        ocva.Clutch = buildOverrideValue(action.clutch);
      }
      if (action.parkingBrake) {
        ocva.ParkingBrake = buildOverrideValue(action.parkingBrake);
      }
      if (action.steeringWheel) {
        ocva.SteeringWheel = buildOverrideValue(action.steeringWheel);
      }
      if (action.gear) {
        ocva.Gear = buildOverrideGearValue(action.gear);
      }
      return { ControllerAction: { OverrideControllerValueAction: ocva } };
    }

    case 'visibilityAction':
      return {
        VisibilityAction: buildAttrs({
          graphics: action.graphics,
          traffic: action.traffic,
          sensors: action.sensors,
          entityRef: action.entityRef,
        }),
      };

    case 'appearanceAction': {
       
      const { type: _type, ...rest } = action;
      return { AppearanceAction: rest };
    }

    case 'animationAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aa: any = {
        AnimationType: buildAttrs({ value: action.animationType }),
      };
      if (action.state !== undefined) {
        aa.AnimationState = buildAttrs({ state: action.state });
      }
      if (action.duration !== undefined || action.loop !== undefined) {
        aa.AnimationDuration = buildAttrs({ duration: action.duration, loop: action.loop });
      }
      return { AnimationAction: aa };
    }

    case 'lightStateAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lsa: any = {};

      // Build XSD-compliant LightType element
      // Internal format: "vehicleLight:indicatorLeft" or "userDefined:customType"
      if (action.lightType.startsWith('vehicleLight:')) {
        lsa.LightType = {
          VehicleLight: buildAttrs({
            vehicleLightType: action.lightType.slice('vehicleLight:'.length),
          }),
        };
      } else if (action.lightType.startsWith('userDefined:')) {
        lsa.LightType = {
          UserDefinedLight: buildAttrs({
            userDefinedLightType: action.lightType.slice('userDefined:'.length),
          }),
        };
      } else {
        // Fallback: treat as vehicle light type directly
        lsa.LightType = {
          VehicleLight: buildAttrs({ vehicleLightType: action.lightType }),
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lightState: any = buildAttrs({ mode: action.mode });
      if (action.intensity !== undefined) {
        lightState.Intensity = buildAttrs({ value: action.intensity });
      }
      if (action.color) {
        lightState.Color = {
          ColorRgb: buildAttrs({
            red: action.color.r,
            green: action.color.g,
            blue: action.color.b,
          }),
        };
      }
      lsa.LightState = lightState;
      if (action.transitionTime !== undefined) {
        lsa['@_transitionTime'] = action.transitionTime;
      }
      return { LightStateAction: lsa };
    }

    case 'connectTrailerAction':
      return {
        ConnectTrailerAction: buildAttrs({ trailerRef: action.trailerRef }),
      };

    case 'disconnectTrailerAction':
      return { DisconnectTrailerAction: '' };
  }
}

// ─── Global Action ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildGlobalAction(action: GlobalAction, elementBindings: Record<string, string> = {}): Record<string, any> {
  switch (action.type) {
    case 'environmentAction':
      return {
        EnvironmentAction: {
          Environment: buildEnvironment(action.environment),
        },
      };

    case 'entityAction': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ea: any = buildAttrs({ entityRef: action.entityRef }, elementBindings);
      if (action.actionType === 'addEntity') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const addEntity: any = {};
        if (action.position) {
          addEntity.Position = buildPosition(action.position);
        }
        ea.AddEntityAction = Object.keys(addEntity).length > 0 ? addEntity : '';
      } else {
        ea.DeleteEntityAction = '';
      }
      return { EntityAction: ea };
    }

    case 'parameterAction': {
      if (action.actionType === 'set') {
        return {
          ParameterAction: {
            SetAction: buildAttrs({ value: action.value }),
            ...buildAttrs({ parameterRef: action.parameterRef }),
          },
        };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modifyAction: any = {};
        if (action.rule && action.modifyValue !== undefined) {
          modifyAction.Rule = {
            ByValue: {
              ...(action.rule === 'add'
                ? { AddValue: buildAttrs({ value: action.modifyValue }) }
                : { MultiplyByValue: buildAttrs({ value: action.modifyValue }) }),
            },
          };
        }
        return {
          ParameterAction: {
            ModifyAction: modifyAction,
            ...buildAttrs({ parameterRef: action.parameterRef }),
          },
        };
      }
    }

    case 'variableAction': {
      if (action.actionType === 'set') {
        return {
          VariableAction: {
            SetAction: buildAttrs({ value: action.value }),
            ...buildAttrs({ variableRef: action.variableRef }),
          },
        };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modifyAction: any = {};
        if (action.rule && action.modifyValue !== undefined) {
          modifyAction.Rule = {
            ByValue: {
              ...(action.rule === 'add'
                ? { AddValue: buildAttrs({ value: action.modifyValue }) }
                : { MultiplyByValue: buildAttrs({ value: action.modifyValue }) }),
            },
          };
        }
        return {
          VariableAction: {
            ModifyAction: modifyAction,
            ...buildAttrs({ variableRef: action.variableRef }),
          },
        };
      }
    }

    case 'infrastructureAction':
      return {
        InfrastructureAction: {
          TrafficSignalAction: buildTrafficSignalAction(action.trafficSignalAction),
        },
      };

    case 'trafficAction': {
       
      const { type: _type, ...rest } = action;
      return { TrafficAction: rest };
    }
  }
}

// ─── User-Defined Action ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildUserDefinedAction(action: UserDefinedAction): Record<string, any> {
  return {
    UserDefinedAction: {
      CustomCommandAction: action.customCommandAction,
    },
  };
}

// ─── Helper builders ────────────────────────────────────────────────────────

function buildTransitionDynamics(d: TransitionDynamics, bindings: Record<string, string> = {}): Record<string, string> {
  return buildAttrs({
    dynamicsShape: d.dynamicsShape,
    value: d.value,
    dynamicsDimension: d.dynamicsDimension,
  }, bindings);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSpeedTarget(target: SpeedTarget, bindings: Record<string, string> = {}): Record<string, any> {
  if (target.kind === 'absolute') {
    return { AbsoluteTargetSpeed: buildAttrs({ value: target.value }, bindings) };
  }
  return {
    RelativeTargetSpeed: buildAttrs({
      entityRef: target.entityRef,
      value: target.value,
      speedTargetValueType: target.speedTargetValueType,
      continuous: target.continuous,
    }, bindings),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLaneChangeTarget(target: LaneChangeTarget, bindings: Record<string, string> = {}): Record<string, any> {
  if (target.kind === 'absolute') {
    return { AbsoluteTargetLane: buildAttrs({ value: target.value }, bindings) };
  }
  return {
    RelativeTargetLane: buildAttrs({
      entityRef: target.entityRef,
      value: target.value,
    }, bindings),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLaneOffsetTarget(target: LaneOffsetTarget, bindings: Record<string, string> = {}): Record<string, any> {
  if (target.kind === 'absolute') {
    return { AbsoluteTargetLaneOffset: buildAttrs({ value: target.value }, bindings) };
  }
  return {
    RelativeTargetLaneOffset: buildAttrs({
      entityRef: target.entityRef,
      value: target.value,
    }, bindings),
  };
}

function buildLaneOffsetDynamics(d: LaneOffsetDynamics, bindings: Record<string, string> = {}): Record<string, string> {
  return buildAttrs({
    maxSpeed: d.maxSpeed,
    maxLateralAcc: d.maxLateralAcc,
    dynamicsShape: d.dynamicsShape,
  }, bindings);
}

function buildDynamicConstraints(d: DynamicConstraints, bindings: Record<string, string> = {}): Record<string, string> {
  return buildAttrs({
    maxAcceleration: d.maxAcceleration,
    maxDeceleration: d.maxDeceleration,
    maxSpeed: d.maxSpeed,
  }, bindings);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFinalSpeed(fs: FinalSpeed): Record<string, any> {
  if (fs.absoluteSpeed) {
    return {
      AbsoluteSpeed: buildAttrs({
        value: fs.absoluteSpeed.value,
        steadyState: fs.absoluteSpeed.steadyState,
      }),
    };
  }
  if (fs.relativeSpeedToMaster) {
    return {
      RelativeSpeedToMaster: buildAttrs({
        value: fs.relativeSpeedToMaster.value,
        speedTargetValueType: fs.relativeSpeedToMaster.speedTargetValueType,
        steadyState: fs.relativeSpeedToMaster.steadyState,
      }),
    };
  }
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTrajectory(t: Trajectory): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = buildAttrs({ name: t.name, closed: t.closed });
  if (t.parameterDeclarations && t.parameterDeclarations.length > 0) {
    result.ParameterDeclarations = buildParameterDeclarations(t.parameterDeclarations);
  }
  result.Shape = buildTrajectoryShape(t.shape);
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTrajectoryShape(shape: Trajectory['shape']): Record<string, any> {
  switch (shape.type) {
    case 'polyline':
      return {
        Polyline: {
          Vertex: shape.vertices.map((v) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const vertex: any = buildAttrs({ time: v.time });
            vertex.Position = buildPosition(v.position);
            return vertex;
          }),
        },
      };
    case 'clothoid': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c: any = buildAttrs({
        curvature: shape.curvature,
        curvatureDot: shape.curvatureDot,
        length: shape.length,
        startTime: shape.startTime,
        stopTime: shape.stopTime,
      });
      if (shape.position) {
        c.Position = buildPosition(shape.position);
      }
      return { Clothoid: c };
    }
    case 'nurbs':
      return {
        Nurbs: {
          ...buildAttrs({ order: shape.order }),
          ControlPoint: shape.controlPoints.map((cp) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const point: any = buildAttrs({ time: cp.time, weight: cp.weight });
            point.Position = buildPosition(cp.position);
            return point;
          }),
          Knot: shape.knots.map((k) => buildAttrs({ value: k })),
        },
      };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTimeReference(tr: TimeReference): Record<string, any> {
  if (tr.timing) {
    return {
      Timing: buildAttrs({
        domainAbsoluteRelative: tr.timing.domainAbsoluteRelative,
        offset: tr.timing.offset,
        scale: tr.timing.scale,
      }),
    };
  }
  return { None: '' };
}

function buildOverrideValue(ov: OverrideValue): Record<string, string> {
  return buildAttrs({
    value: ov.value,
    active: ov.active,
    maxRate: ov.maxRate,
    maxTorque: ov.maxTorque,
  });
}

function buildOverrideGearValue(ogv: OverrideGearValue): Record<string, string> {
  return buildAttrs({
    number: ogv.number,
    active: ogv.active,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildEnvironment(env: Environment): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = buildAttrs({ name: env.name });
  if (env.parameterDeclarations && env.parameterDeclarations.length > 0) {
    result.ParameterDeclarations = buildParameterDeclarations(env.parameterDeclarations);
  }
  result.TimeOfDay = buildAttrs({
    animation: env.timeOfDay.animation,
    dateTime: env.timeOfDay.dateTime,
  });
  result.Weather = buildWeather(env.weather);
  result.RoadCondition = buildAttrs({
    frictionScaleFactor: env.roadCondition.frictionScaleFactor,
    wetness: env.roadCondition.wetness,
  });
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWeather(w: Weather): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = buildAttrs({
    fractionalCloudCover: w.fractionalCloudCover,
    atmosphericPressure: w.atmosphericPressure,
    temperature: w.temperature,
  });
  if (w.sun) {
    result.Sun = buildAttrs({
      intensity: w.sun.intensity,
      azimuth: w.sun.azimuth,
      elevation: w.sun.elevation,
    });
  }
  if (w.fog) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fog: any = buildAttrs({ visualRange: w.fog.visualRange });
    if (w.fog.boundingBox) {
      fog.BoundingBox = {
        Center: buildAttrs({
          x: w.fog.boundingBox.center.x,
          y: w.fog.boundingBox.center.y,
          z: w.fog.boundingBox.center.z,
        }),
        Dimensions: buildAttrs({
          width: w.fog.boundingBox.dimensions.width,
          length: w.fog.boundingBox.dimensions.length,
          height: w.fog.boundingBox.dimensions.height,
        }),
      };
    }
    result.Fog = fog;
  }
  if (w.precipitation) {
    result.Precipitation = buildAttrs({
      precipitationType: w.precipitation.precipitationType,
      precipitationIntensity: w.precipitation.precipitationIntensity,
    });
  }
  if (w.wind) {
    result.Wind = buildAttrs({
      direction: w.wind.direction,
      speed: w.wind.speed,
    });
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTrafficSignalAction(tsa: TrafficSignalAction): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  if (tsa.controllerRef) {
    result.TrafficSignalControllerAction = buildAttrs({
      trafficSignalControllerRef: tsa.controllerRef,
      phase: tsa.controllerAction?.phase,
    });
  }
  if (tsa.stateAction) {
    result.TrafficSignalStateAction = buildAttrs({
      name: tsa.stateAction.name,
      state: tsa.stateAction.state,
    });
  }
  return result;
}

export function buildRoute(route: {
  name: string;
  closed: boolean;
  parameterDeclarations?: ParameterDeclaration[];
  waypoints: Array<{ position: Position; routeStrategy: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    ...buildAttrs({ name: route.name, closed: route.closed }),
  };
  if (route.parameterDeclarations && route.parameterDeclarations.length > 0) {
    result.ParameterDeclarations = buildParameterDeclarations(route.parameterDeclarations);
  }
  result.Waypoint = route.waypoints.map((wp) => ({
    ...buildAttrs({ routeStrategy: wp.routeStrategy }),
    Position: buildPosition(wp.position),
  }));
  return result;
}
