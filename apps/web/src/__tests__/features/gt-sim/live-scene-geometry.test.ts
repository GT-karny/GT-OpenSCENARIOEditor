import { describe, it, expect } from 'vitest';
import type { GtSimOsiObject } from '@osce/esmini';
import {
  flipY,
  getBoundaryStyle,
  getObjectColors,
  classifySign,
  trafficLightFill,
  speedColor,
} from '../../../features/gt-sim/live/lib/sceneGeometry';

function makeObject(overrides: Partial<GtSimOsiObject> = {}): GtSimOsiObject {
  return {
    id: 1,
    name: 'car1',
    x: 0,
    y: 0,
    z: 0,
    h: 0,
    speed: 0,
    head_light: 'off',
    indicator: 'off',
    brake_light: 'off',
    obj_type: 'vehicle',
    vehicle_class: 'car',
    length: 4,
    width: 2,
    ...overrides,
  };
}

describe('sceneGeometry — pure helpers', () => {
  it('flipY negates world Y for the SVG (Y-down) mapping', () => {
    expect(flipY(5)).toBe(-5);
    expect(flipY(-3)).toBe(3);
    expect(flipY(0)).toBe(-0);
  });

  it('getBoundaryStyle returns a distinct style per boundary type and a safe default', () => {
    expect(getBoundaryStyle('center_line').stroke).toContain('220,200,50');
    expect(getBoundaryStyle('lane_divider').dasharray).toBe('3 2');
    expect(getBoundaryStyle('road_edge').strokeWidth).toBe(0.25);
    expect(getBoundaryStyle('unknown_type')).toEqual({
      stroke: 'rgba(180,180,180,0.4)',
      strokeWidth: 0.1,
      dasharray: '',
      opacity: 0.4,
    });
  });

  it('getObjectColors always uses the ego palette for the ego object regardless of type', () => {
    const ego = makeObject({ obj_type: 'pedestrian' });
    expect(getObjectColors(ego, true)).toEqual({
      fill: 'var(--color-primary, #7B88E8)',
      stroke: 'var(--color-accent-vivid, #9B84E8)',
    });
  });

  it('getObjectColors classifies non-ego vehicles by vehicle_class', () => {
    const truck = makeObject({ obj_type: 'vehicle', vehicle_class: 'heavy_truck' });
    expect(getObjectColors(truck, false).fill).toContain('200,120,120');

    const bike = makeObject({ obj_type: 'vehicle', vehicle_class: 'bicycle' });
    expect(getObjectColors(bike, false).fill).toContain('120,200,120');

    const car = makeObject({ obj_type: 'vehicle', vehicle_class: 'car' });
    expect(getObjectColors(car, false).fill).toContain('180,170,230');
  });

  it('getObjectColors falls back to a neutral color for unknown obj_type', () => {
    const other = makeObject({ obj_type: 'unknown' });
    expect(getObjectColors(other, false)).toEqual({
      fill: 'rgba(150,150,150,0.3)',
      stroke: 'rgba(150,150,150,0.5)',
    });
  });

  it('classifySign detects stop/yield keywords case-insensitively, else "other"', () => {
    expect(classifySign('Stop Sign').kind).toBe('stop');
    expect(classifySign('yield ahead').kind).toBe('yield');
    expect(classifySign('Give Way').kind).toBe('yield');
    expect(classifySign('Speed Limit 50').kind).toBe('other');
  });

  it('trafficLightFill maps known colors and falls back to grey', () => {
    expect(trafficLightFill('red')).toBe('rgb(235,50,50)');
    expect(trafficLightFill('yellow')).toBe('rgb(240,200,50)');
    expect(trafficLightFill('green')).toBe('rgb(60,210,90)');
    expect(trafficLightFill('unknown')).toBe('rgb(160,160,160)');
  });

  it('speedColor clamps its input fraction to [0,1]', () => {
    expect(speedColor(-1)).toBe(speedColor(0));
    expect(speedColor(2)).toBe(speedColor(1));
    expect(speedColor(0)).toBe('rgb(80,210,140)');
    expect(speedColor(1)).toBe('rgb(235,90,90)');
  });
});
