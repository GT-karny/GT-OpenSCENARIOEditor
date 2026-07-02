import { describe, it, expect } from 'vitest';
import type { ScenarioEntity } from '@osce/shared';
import { deepCloneWithNewIds } from '../operations/deep-clone.js';

function makeEntity(): ScenarioEntity {
  return {
    id: 'orig-id',
    name: 'Ego',
    type: 'vehicle',
    definition: {
      kind: 'vehicle',
      name: 'Ego',
      vehicleCategory: 'car',
      parameterDeclarations: [
        { id: 'param-a', name: 'a', parameterType: 'double', value: '1' },
        { id: 'param-b', name: 'b', parameterType: 'double', value: '2' },
      ],
      performance: { maxSpeed: 50, maxAcceleration: 5, maxDeceleration: 5 },
      boundingBox: {
        center: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1, length: 1, height: 1 },
      },
      axles: {
        frontAxle: {
          maxSteering: 0.5,
          wheelDiameter: 0.6,
          trackWidth: 1.5,
          positionX: 2,
          positionZ: 0.3,
        },
        rearAxle: {
          maxSteering: 0,
          wheelDiameter: 0.6,
          trackWidth: 1.5,
          positionX: 0,
          positionZ: 0.3,
        },
        additionalAxles: [],
      },
      properties: [],
    },
  };
}

describe('deepCloneWithNewIds — entity', () => {
  it('regenerates the entity id', () => {
    const source = makeEntity();
    const clone = deepCloneWithNewIds(source, 'entity');
    expect(clone.id).not.toBe('orig-id');
    expect(clone.id).toBeTruthy();
  });

  it('regenerates nested ParameterDeclaration ids', () => {
    const source = makeEntity();
    const clone = deepCloneWithNewIds(source, 'entity');
    const params = (clone.definition as { parameterDeclarations: { id: string }[] })
      .parameterDeclarations;
    expect(params[0].id).not.toBe('param-a');
    expect(params[1].id).not.toBe('param-b');
    expect(params[0].id).not.toBe(params[1].id);
  });

  it('does not mutate the source entity', () => {
    const source = makeEntity();
    deepCloneWithNewIds(source, 'entity');
    expect(source.id).toBe('orig-id');
    const params = (source.definition as { parameterDeclarations: { id: string }[] })
      .parameterDeclarations;
    expect(params[0].id).toBe('param-a');
  });

  it('leaves the entity name untouched (caller assigns unique name)', () => {
    const source = makeEntity();
    const clone = deepCloneWithNewIds(source, 'entity');
    expect(clone.name).toBe('Ego');
  });

  it('regenerates controller parameter ids when present', () => {
    const source = makeEntity();
    source.controller = {
      controller: {
        kind: 'controller',
        name: 'Ctrl',
        parameterDeclarations: [{ id: 'ctrl-p', name: 'g', parameterType: 'double', value: '9.8' }],
        properties: [],
      },
    };
    const clone = deepCloneWithNewIds(source, 'entity');
    const ctrlParams = (clone.controller!.controller as { parameterDeclarations: { id: string }[] })
      .parameterDeclarations;
    expect(ctrlParams[0].id).not.toBe('ctrl-p');
  });
});
