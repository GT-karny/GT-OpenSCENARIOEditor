import { describe, it, expect } from 'vitest';
import type {
  PrivateAction,
  GlobalAction,
  AnimationAction,
  LightStateAction,
  FollowTrajectoryAction,
  EnvironmentAction,
  RoutingAction,
  TrajectoryPosition,
} from '@osce/shared';
import {
  parsePrivateAction,
  parseGlobalAction,
} from '../../parser/parse-actions.js';
import {
  buildPrivateAction,
  buildGlobalAction,
} from '../../serializer/build-actions.js';
import { parsePosition } from '../../parser/parse-positions.js';
import { buildPositionWrapped } from '../../serializer/build-positions.js';
import { createXoscXmlParser } from '../../parser/fxp-config.js';
import { createXoscXmlBuilder } from '../../serializer/fxp-builder-config.js';

const xmlParser = createXoscXmlParser();
const xmlBuilder = createXoscXmlBuilder(false);

/**
 * Round-trip a PrivateAction through the real XML serialize → parse cycle:
 * model → build object → XML string → parsed object → model.
 */
function roundTripPrivateAction(action: PrivateAction): { action: PrivateAction; xml: string } {
  const built = buildPrivateAction(action);
  const xml = xmlBuilder.build({ PrivateAction: built });
  const reparsed = xmlParser.parse(xml);
  return { action: parsePrivateAction(reparsed.PrivateAction), xml };
}

function roundTripGlobalAction(action: GlobalAction): { action: GlobalAction; xml: string } {
  const built = buildGlobalAction(action);
  const xml = xmlBuilder.build({ GlobalAction: built });
  const reparsed = xmlParser.parse(xml);
  return { action: parseGlobalAction(reparsed.GlobalAction), xml };
}

// Position content is wrapped in <Position> for serialize, but parsePosition
// expects the wrapper, so round-trip through <Position>.
function roundTripPosition(pos: TrajectoryPosition): { pos: ReturnType<typeof parsePosition>; xml: string } {
  const built = buildPositionWrapped(pos);
  const xml = xmlBuilder.build(built);
  const reparsed = xmlParser.parse(xml);
  return { pos: parsePosition(reparsed.Position), xml };
}

describe('AnimationAction round-trip (XSD AnimationType + loop/animationDuration)', () => {
  it('round-trips animationType, state, duration and loop', () => {
    const input: AnimationAction = {
      type: 'animationAction',
      animationType: 'wiper',
      state: '0.5',
      duration: 2.5,
      loop: true,
    };

    const { action, xml } = roundTripPrivateAction(input);

    // XSD-compliant shape: UserDefinedAnimation inside AnimationType,
    // AnimationState child, loop/animationDuration attributes.
    expect(xml).toContain('<UserDefinedAnimation userDefinedAnimationType="wiper"');
    expect(xml).toContain('<AnimationState state="0.5"');
    expect(xml).toContain('animationDuration="2.5"');
    expect(xml).not.toContain('<AnimationDuration'); // no non-XSD wrapper
    expect(xml).not.toContain('<AnimationType value'); // no value attribute
    expect(action).toEqual(input);
  });

  it('round-trips a minimal animationType without state/duration/loop', () => {
    const input: AnimationAction = {
      type: 'animationAction',
      animationType: 'doorOpen',
    };
    const { action } = roundTripPrivateAction(input);
    expect(action).toEqual(input);
  });
});

describe('LightStateAction round-trip (XSD luminousIntensity attribute + colorType)', () => {
  it('round-trips lightType, mode, intensity, color and transitionTime', () => {
    const input: LightStateAction = {
      type: 'lightStateAction',
      lightType: 'vehicleLight:indicatorLeft',
      mode: 'flashing',
      intensity: 100,
      color: { r: 255, g: 0, b: 0 },
      transitionTime: 1.5,
    };

    const { action, xml } = roundTripPrivateAction(input);

    expect(xml).toContain('<VehicleLight vehicleLightType="indicatorLeft"');
    expect(xml).toContain('luminousIntensity="100"');
    expect(xml).not.toContain('<Intensity'); // intensity is an attribute, not a child
    expect(xml).toContain('colorType="rgb"');
    expect(xml).toContain('<ColorRgb red="255"');
    expect(xml).toContain('transitionTime="1.5"');
    expect(action).toEqual(input);
  });

  it('round-trips a user-defined light without color/intensity', () => {
    const input: LightStateAction = {
      type: 'lightStateAction',
      lightType: 'userDefined:custom',
      mode: 'on',
    };
    const { action, xml } = roundTripPrivateAction(input);
    expect(xml).toContain('<UserDefinedLight userDefinedLightType="custom"');
    expect(action).toEqual(input);
  });
});

describe('FollowTrajectoryAction round-trip (XSD TrajectoryRef)', () => {
  it('preserves a catalog-referenced trajectory via TrajectoryRef', () => {
    const input: FollowTrajectoryAction = {
      type: 'followTrajectoryAction',
      trajectoryRef: { catalogName: 'TrajectoryCatalog', entryName: 'NorthToSouth' },
      timeReference: { none: true },
      followingMode: 'position',
      initialDistanceOffset: 3,
    };

    const { action, xml } = roundTripPrivateAction(input);

    expect(xml).toContain('<TrajectoryRef>');
    expect(xml).toContain('<CatalogReference catalogName="TrajectoryCatalog" entryName="NorthToSouth"');
    expect(action).toEqual(input);
  });

  it('round-trips an inline trajectory', () => {
    const input: FollowTrajectoryAction = {
      type: 'followTrajectoryAction',
      trajectory: {
        name: 'traj1',
        closed: false,
        parameterDeclarations: [],
        shape: {
          type: 'polyline',
          vertices: [{ position: { type: 'worldPosition', x: 1, y: 2 }, time: 0 }],
        },
      },
      timeReference: { none: true },
      followingMode: 'follow',
    };
    const { action } = roundTripPrivateAction(input);
    expect(action).toEqual(input);
  });

  it('round-trips a ClothoidSpline trajectory shape (v1.3)', () => {
    const input: FollowTrajectoryAction = {
      type: 'followTrajectoryAction',
      trajectory: {
        name: 'spline',
        closed: false,
        parameterDeclarations: [],
        shape: {
          type: 'clothoidSpline',
          segments: [
            { curvatureStart: 0, curvatureEnd: -0.08, length: 5 },
            {
              curvatureStart: -0.08,
              curvatureEnd: 0.12,
              length: 10.5,
              positionStart: { type: 'relativeObjectPosition', entityRef: 'Car', dx: 0, dy: 0 },
            },
          ],
        },
      },
      timeReference: { none: true },
      followingMode: 'position',
    };
    const { action, xml } = roundTripPrivateAction(input);
    expect(xml).toContain('<ClothoidSpline>');
    expect(xml).toContain('<ClothoidSplineSegment curvatureStart="0" curvatureEnd="-0.08" length="5"');
    expect(action).toEqual(input);
  });

  it('parses an inline trajectory with an empty polyline without throwing', () => {
    // <Polyline/> collapses to '' on re-parse; should yield empty vertices.
    const xml =
      '<PrivateAction><RoutingAction><FollowTrajectoryAction>' +
      '<Trajectory name="t" closed="false"><Shape><Polyline/></Shape></Trajectory>' +
      '<TimeReference><None/></TimeReference>' +
      '<TrajectoryFollowingMode followingMode="position"/>' +
      '</FollowTrajectoryAction></RoutingAction></PrivateAction>';
    const reparsed = xmlParser.parse(xml);
    const action = parsePrivateAction(reparsed.PrivateAction) as FollowTrajectoryAction;
    expect(action.trajectory?.shape).toEqual({ type: 'polyline', vertices: [] });
  });
});

describe('EnvironmentAction round-trip (XSD Environment | CatalogReference)', () => {
  it('preserves a catalog reference', () => {
    const input: EnvironmentAction = {
      type: 'environmentAction',
      catalogReference: { catalogName: 'EnvironmentCatalog', entryName: 'winter' },
    };

    const { action, xml } = roundTripGlobalAction(input);

    expect(xml).toContain('<CatalogReference catalogName="EnvironmentCatalog" entryName="winter"');
    expect(xml).not.toContain('<Environment ');
    expect(action).toEqual(input);
  });

  it('parses a catalog-reference EnvironmentAction without throwing', () => {
    const xml =
      '<GlobalAction><EnvironmentAction>' +
      '<CatalogReference catalogName="EnvironmentCatalog" entryName="winter"/>' +
      '</EnvironmentAction></GlobalAction>';
    const reparsed = xmlParser.parse(xml);
    expect(() => parseGlobalAction(reparsed.GlobalAction)).not.toThrow();
  });

  it('still round-trips an inline environment', () => {
    const input: EnvironmentAction = {
      type: 'environmentAction',
      environment: {
        name: 'weather',
        parameterDeclarations: [],
        timeOfDay: { animation: true, dateTime: '2025-06-13T00:00:00.000+00:00' },
        weather: {},
        roadCondition: { frictionScaleFactor: 1 },
      },
    };
    const { action } = roundTripGlobalAction(input);
    expect(action).toEqual(input);
  });
});

describe('RoutingAction randomRoute round-trip (XSD RandomRouteAction)', () => {
  it('preserves a RandomRouteAction without throwing', () => {
    const input: RoutingAction = {
      type: 'routingAction',
      routeAction: 'randomRoute',
    };

    const { action, xml } = roundTripPrivateAction(input);

    expect(xml).toContain('<RandomRouteAction');
    expect(action).toEqual(input);
  });
});

describe('TrajectoryPosition round-trip (XSD TrajectoryRef + s + Orientation)', () => {
  it('preserves a catalog-referenced trajectory position', () => {
    const input: TrajectoryPosition = {
      type: 'trajectoryPosition',
      trajectoryRef: { catalogReference: { catalogName: 'TrajectoryCatalog', entryName: 'route1' } },
      s: 12.5,
      t: 0.3,
      orientation: { type: 'relative', h: 0.1 },
    };

    const { pos, xml } = roundTripPosition(input);

    expect(xml).toContain('<TrajectoryPosition');
    expect(xml).toContain('s="12.5"');
    expect(xml).toContain('<TrajectoryRef>');
    expect(pos).toEqual(input);
  });

  it('round-trips an inline trajectory position', () => {
    const input: TrajectoryPosition = {
      type: 'trajectoryPosition',
      trajectoryRef: {
        trajectory: {
          name: 't1',
          closed: false,
          parameterDeclarations: [],
          shape: { type: 'polyline', vertices: [] },
        },
      },
      s: 5,
    };
    const { pos } = roundTripPosition(input);
    expect(pos).toEqual(input);
  });
});
