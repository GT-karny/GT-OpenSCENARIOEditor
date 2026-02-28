import { describe, it, expect } from 'vitest';
import {
  convertGroundTruth,
  convertMovingObject,
  getEntityName,
  computeSpeed,
} from '../converter/ground-truth-converter.js';
import type { osi3 } from '../generated/osi.js';

// Helper to create a mock MovingObject
function createMovingObject(
  overrides: Partial<{
    id: number;
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    roll: number;
    vx: number;
    vy: number;
    vz: number;
    entityName: string;
    sourceRefType: string;
  }> = {},
): osi3.IMovingObject {
  const {
    id = 1,
    x = 10,
    y = 20,
    z = 0,
    yaw = 1.5,
    pitch = 0,
    roll = 0,
    vx = 3,
    vy = 4,
    vz = 0,
    entityName = 'Ego',
    sourceRefType = 'net.asam.openscenario',
  } = overrides;

  return {
    id: { value: id },
    base: {
      position: { x, y, z },
      orientation: { yaw, pitch, roll },
      velocity: { x: vx, y: vy, z: vz },
    },
    sourceReference: [
      {
        type: sourceRefType,
        reference: 'scenario.xosc',
        identifier: [
          `entity_id:${id}`,
          'entity_type:Vehicle',
          `entity_name:${entityName}`,
        ],
      },
    ],
  };
}

describe('convertGroundTruth', () => {
  it('should convert timestamp to time in seconds', () => {
    const gt: osi3.IGroundTruth = {
      timestamp: { seconds: 10, nanos: 500_000_000 },
      movingObject: [],
    };
    const frame = convertGroundTruth(gt);
    expect(frame.time).toBeCloseTo(10.5, 9);
  });

  it('should handle timestamp with only seconds', () => {
    const gt: osi3.IGroundTruth = {
      timestamp: { seconds: 5 },
      movingObject: [],
    };
    const frame = convertGroundTruth(gt);
    expect(frame.time).toBe(5);
  });

  it('should handle null timestamp', () => {
    const gt: osi3.IGroundTruth = {
      movingObject: [],
    };
    const frame = convertGroundTruth(gt);
    expect(frame.time).toBe(0);
  });

  it('should convert moving objects to SimulationObjectState[]', () => {
    const gt: osi3.IGroundTruth = {
      timestamp: { seconds: 1, nanos: 0 },
      movingObject: [
        createMovingObject({ id: 0, entityName: 'Ego' }),
        createMovingObject({ id: 1, entityName: 'Target' }),
      ],
    };
    const frame = convertGroundTruth(gt);
    expect(frame.objects).toHaveLength(2);
    expect(frame.objects[0].name).toBe('Ego');
    expect(frame.objects[1].name).toBe('Target');
  });

  it('should handle empty moving_object array', () => {
    const gt: osi3.IGroundTruth = {
      timestamp: { seconds: 0, nanos: 0 },
      movingObject: [],
    };
    const frame = convertGroundTruth(gt);
    expect(frame.objects).toHaveLength(0);
  });

  it('should handle null movingObject', () => {
    const gt: osi3.IGroundTruth = {
      timestamp: { seconds: 0, nanos: 0 },
    };
    const frame = convertGroundTruth(gt);
    expect(frame.objects).toHaveLength(0);
  });
});

describe('convertMovingObject', () => {
  it('should convert position correctly', () => {
    const mo = createMovingObject({ x: 100, y: 200, z: 5 });
    const state = convertMovingObject(mo);
    expect(state.x).toBe(100);
    expect(state.y).toBe(200);
    expect(state.z).toBe(5);
  });

  it('should map orientation yaw→h, pitch→p, roll→r correctly', () => {
    const mo = createMovingObject({ yaw: 1.57, pitch: 0.1, roll: 0.05 });
    const state = convertMovingObject(mo);
    expect(state.h).toBe(1.57);
    expect(state.p).toBe(0.1);
    expect(state.r).toBe(0.05);
  });

  it('should compute speed from velocity vector', () => {
    const mo = createMovingObject({ vx: 3, vy: 4, vz: 0 });
    const state = convertMovingObject(mo);
    expect(state.speed).toBeCloseTo(5, 10);
  });

  it('should handle null base', () => {
    const mo: osi3.IMovingObject = {
      id: { value: 1 },
      sourceReference: [],
    };
    const state = convertMovingObject(mo);
    expect(state.x).toBe(0);
    expect(state.y).toBe(0);
    expect(state.z).toBe(0);
    expect(state.h).toBe(0);
    expect(state.speed).toBe(0);
  });

  it('should handle null position/orientation/velocity', () => {
    const mo: osi3.IMovingObject = {
      id: { value: 2 },
      base: {},
      sourceReference: [],
    };
    const state = convertMovingObject(mo);
    expect(state.x).toBe(0);
    expect(state.h).toBe(0);
    expect(state.speed).toBe(0);
  });
});

describe('getEntityName', () => {
  it('should find entity_name from net.asam.openscenario source_reference', () => {
    const mo = createMovingObject({ entityName: 'Ego' });
    expect(getEntityName(mo)).toBe('Ego');
  });

  it('should skip non-openscenario source references', () => {
    const mo: osi3.IMovingObject = {
      id: { value: 42 },
      sourceReference: [
        {
          type: 'net.asam.opendrive',
          identifier: ['entity_name:ShouldNotMatch'],
        },
      ],
    };
    expect(getEntityName(mo)).toBe('object_42');
  });

  it('should return fallback for missing source_reference', () => {
    const mo: osi3.IMovingObject = {
      id: { value: 99 },
      sourceReference: [],
    };
    expect(getEntityName(mo)).toBe('object_99');
  });

  it('should return fallback when no entity_name identifier exists', () => {
    const mo: osi3.IMovingObject = {
      id: { value: 5 },
      sourceReference: [
        {
          type: 'net.asam.openscenario',
          identifier: ['entity_id:5', 'entity_type:Vehicle'],
        },
      ],
    };
    expect(getEntityName(mo)).toBe('object_5');
  });

  it('should handle null sourceReference', () => {
    const mo: osi3.IMovingObject = {
      id: { value: 7 },
    };
    expect(getEntityName(mo)).toBe('object_7');
  });
});

describe('computeSpeed', () => {
  it('should return 0 for null velocity', () => {
    expect(computeSpeed(null)).toBe(0);
    expect(computeSpeed(undefined)).toBe(0);
  });

  it('should compute magnitude correctly', () => {
    expect(computeSpeed({ x: 3, y: 4, z: 0 })).toBeCloseTo(5, 10);
  });

  it('should handle 3D velocity', () => {
    expect(computeSpeed({ x: 1, y: 2, z: 2 })).toBeCloseTo(3, 10);
  });

  it('should handle zero velocity', () => {
    expect(computeSpeed({ x: 0, y: 0, z: 0 })).toBe(0);
  });

  it('should handle partial velocity (missing components)', () => {
    expect(computeSpeed({ x: 5 })).toBeCloseTo(5, 10);
  });
});
