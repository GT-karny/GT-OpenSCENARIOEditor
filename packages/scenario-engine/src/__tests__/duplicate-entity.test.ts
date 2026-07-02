import { describe, it, expect } from 'vitest';
import { createScenarioStore } from '../store/scenario-store.js';
import { DuplicateEntityCommand } from '../commands/entity-commands.js';
import { createMockGetSet } from './helpers.js';
import { createDefaultDocument } from '../store/defaults.js';

describe('DuplicateEntityCommand', () => {
  it('clones the entity with a fresh id and unique name', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    // Seed via document mutation for the mock get/set harness.
    setDoc({
      ...getDoc(),
      entities: [
        {
          id: 'ego-id',
          name: 'Ego',
          type: 'vehicle',
          definition: {
            kind: 'vehicle',
            name: 'Ego',
            vehicleCategory: 'car',
            parameterDeclarations: [{ id: 'p1', name: 'x', parameterType: 'double', value: '1' }],
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
        },
      ],
    });

    const cmd = new DuplicateEntityCommand('ego-id', getDoc, setDoc);
    cmd.execute();

    const entities = getLatest().entities;
    expect(entities).toHaveLength(2);
    const clone = entities[1];
    expect(clone.name).toBe('Ego_copy');
    expect(clone.id).not.toBe('ego-id');
    // Nested parameter id regenerated.
    const params = (clone.definition as { parameterDeclarations: { id: string }[] })
      .parameterDeclarations;
    expect(params[0].id).not.toBe('p1');
  });

  it('clones the source entity init actions with retargeted entityRef', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    setDoc({
      ...getDoc(),
      entities: [
        {
          id: 'ego-id',
          name: 'Ego',
          type: 'vehicle',
          definition: {
            kind: 'vehicle',
            name: 'Ego',
            vehicleCategory: 'car',
            parameterDeclarations: [],
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
        },
      ],
      storyboard: {
        ...getDoc().storyboard,
        init: {
          ...getDoc().storyboard.init,
          entityActions: [
            {
              id: 'init-ego',
              entityRef: 'Ego',
              privateActions: [
                {
                  id: 'pa1',
                  action: {
                    type: 'teleportAction',
                    position: { type: 'worldPosition', x: 1, y: 2 },
                  },
                },
              ],
            },
          ],
        },
      },
    });

    const cmd = new DuplicateEntityCommand('ego-id', getDoc, setDoc);
    cmd.execute();

    const initActions = getLatest().storyboard.init.entityActions;
    expect(initActions).toHaveLength(2);
    const cloned = initActions.find((ea) => ea.entityRef === 'Ego_copy');
    expect(cloned).toBeDefined();
    expect(cloned!.id).not.toBe('init-ego');
    expect(cloned!.privateActions[0].id).not.toBe('pa1');
    // Original init actions untouched.
    const original = initActions.find((ea) => ea.entityRef === 'Ego');
    expect(original!.privateActions[0].id).toBe('pa1');
  });

  it('undo removes both the cloned entity and its init actions', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    setDoc({
      ...getDoc(),
      entities: [
        {
          id: 'ego-id',
          name: 'Ego',
          type: 'vehicle',
          definition: {
            kind: 'vehicle',
            name: 'Ego',
            vehicleCategory: 'car',
            parameterDeclarations: [],
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
        },
      ],
    });

    const cmd = new DuplicateEntityCommand('ego-id', getDoc, setDoc);
    cmd.execute();
    expect(getLatest().entities).toHaveLength(2);
    expect(getLatest().storyboard.init.entityActions.length).toBeGreaterThanOrEqual(1);

    cmd.undo();
    expect(getLatest().entities).toHaveLength(1);
    expect(
      getLatest().storyboard.init.entityActions.some((ea) => ea.entityRef === 'Ego_copy'),
    ).toBe(false);
  });
});

describe('store.duplicateEntity', () => {
  it('lands as a SINGLE history entry that one undo reverts', () => {
    const store = createScenarioStore();
    const ego = store.getState().addEntity({ name: 'Ego' });

    const undoLenBefore = store.getState().getCommandHistory().getUndoStack().length;
    const clone = store.getState().duplicateEntity(ego.id);

    expect(clone).toBeDefined();
    expect(store.getState().getScenario().entities).toHaveLength(2);

    const undoLenAfter = store.getState().getCommandHistory().getUndoStack().length;
    expect(undoLenAfter - undoLenBefore).toBe(1);

    store.getState().undo();
    expect(store.getState().getScenario().entities).toHaveLength(1);
    expect(store.getState().getScenario().entities[0].id).toBe(ego.id);
  });

  it('assigns _copy2 when _copy already exists', () => {
    const store = createScenarioStore();
    const ego = store.getState().addEntity({ name: 'Ego' });
    store.getState().duplicateEntity(ego.id);
    store.getState().duplicateEntity(ego.id);

    const names = store
      .getState()
      .getScenario()
      .entities.map((e) => e.name);
    expect(names).toContain('Ego');
    expect(names).toContain('Ego_copy');
    expect(names).toContain('Ego_copy2');
  });
});
