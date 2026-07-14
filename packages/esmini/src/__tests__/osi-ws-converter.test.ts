import { describe, it, expect } from 'vitest';
import {
  convertOsiGroundTruthMessage,
  convertOsiObject,
  convertVehicleLights,
  convertTrafficLight,
} from '../converter/osi-ws-converter.js';
import type { GtSimOsiObject, GtSimOsiTrafficLight } from '../streaming/types.js';

function makeObject(overrides: Partial<GtSimOsiObject> = {}): GtSimOsiObject {
  return {
    id: 1,
    name: 'Ego',
    x: 10,
    y: 20,
    z: 0.5,
    h: 1.57,
    speed: 13.9,
    head_light: 'off',
    indicator: 'off',
    brake_light: 'off',
    obj_type: 'vehicle',
    vehicle_class: 'medium_car',
    length: 4.5,
    width: 1.8,
    ...overrides,
  };
}

function makeTrafficLight(overrides: Partial<GtSimOsiTrafficLight> = {}): GtSimOsiTrafficLight {
  return {
    id: 100,
    x: 5,
    y: 6,
    z: 3,
    h: 0,
    color: 'red',
    mode: 'constant',
    icon: 0,
    ...overrides,
  };
}

describe('convertOsiObject', () => {
  it('maps position/heading/speed and defaults pitch/roll to 0', () => {
    const state = convertOsiObject(makeObject());
    expect(state).toEqual({
      id: 1,
      name: 'Ego',
      x: 10,
      y: 20,
      z: 0.5,
      h: 1.57,
      p: 0,
      r: 0,
      speed: 13.9,
    });
  });

  it('falls back to object_{id} when the name is empty', () => {
    expect(convertOsiObject(makeObject({ id: 7, name: '' })).name).toBe('object_7');
  });
});

describe('convertVehicleLights', () => {
  it('maps head/brake/indicator strings to VehicleLightFrameState', () => {
    const lights = convertVehicleLights(
      makeObject({ head_light: 'on', indicator: 'left', brake_light: 'normal' }),
    );
    expect(lights).toEqual({
      name: 'Ego',
      indicator: 'left',
      headLight: true,
      highBeam: false,
      brakeLight: true,
    });
  });

  it('treats strong brake as brakeLight on', () => {
    expect(convertVehicleLights(makeObject({ brake_light: 'strong' })).brakeLight).toBe(true);
  });

  it('maps warning indicator through', () => {
    expect(convertVehicleLights(makeObject({ indicator: 'warning' })).indicator).toBe('warning');
  });

  it('normalizes unknown indicator values to off', () => {
    expect(convertVehicleLights(makeObject({ indicator: 'sideways' })).indicator).toBe('off');
  });

  it('all-off stays off', () => {
    const lights = convertVehicleLights(makeObject());
    expect(lights.headLight).toBe(false);
    expect(lights.brakeLight).toBe(false);
    expect(lights.indicator).toBe('off');
  });
});

describe('convertTrafficLight', () => {
  it('uses the lamp colour as state when lit', () => {
    expect(convertTrafficLight(makeTrafficLight({ color: 'green', mode: 'constant' }))).toEqual({
      signalId: 100,
      state: 'green',
    });
  });

  it('uses off when the lamp mode is off', () => {
    expect(convertTrafficLight(makeTrafficLight({ color: 'red', mode: 'off' })).state).toBe('off');
  });

  it('flashing lamps keep their colour (steady) on this path', () => {
    expect(convertTrafficLight(makeTrafficLight({ color: 'yellow', mode: 'flashing' })).state).toBe(
      'yellow',
    );
  });
});

describe('convertOsiGroundTruthMessage', () => {
  it('converts time, objects, vehicle lights and traffic lights', () => {
    const frame = convertOsiGroundTruthMessage({
      type: 'ground_truth',
      sim_time: 2.5,
      objects: [
        makeObject({ id: 0, name: 'Ego', head_light: 'on' }),
        makeObject({ id: 1, name: 'Target', indicator: 'right' }),
      ],
      traffic_lights: [
        makeTrafficLight({ id: 10, color: 'red', mode: 'constant' }),
        makeTrafficLight({ id: 11, color: 'green', mode: 'off' }),
      ],
    });

    expect(frame.time).toBe(2.5);
    expect(frame.objects.map((o) => o.name)).toEqual(['Ego', 'Target']);
    expect(frame.vehicleLightStates).toEqual([
      { name: 'Ego', indicator: 'off', headLight: true, highBeam: false, brakeLight: false },
      { name: 'Target', indicator: 'right', headLight: false, highBeam: false, brakeLight: false },
    ]);
    expect(frame.trafficLightStates).toEqual([
      { signalId: 10, state: 'red' },
      { signalId: 11, state: 'off' },
    ]);
  });

  it('leaves trafficLightStates undefined when the frame omits traffic_lights', () => {
    const frame = convertOsiGroundTruthMessage({
      type: 'ground_truth',
      sim_time: 1,
      objects: [makeObject()],
    });
    expect(frame.trafficLightStates).toBeUndefined();
  });

  it('handles empty object arrays', () => {
    const frame = convertOsiGroundTruthMessage({ type: 'ground_truth', sim_time: 0, objects: [] });
    expect(frame.objects).toEqual([]);
    expect(frame.vehicleLightStates).toEqual([]);
  });
});
