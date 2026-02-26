import { describe, it, expect } from 'vitest';
import { AddEntityCommand, RemoveEntityCommand, UpdateEntityCommand } from '../commands/entity-commands.js';
import { createDefaultDocument } from '../store/defaults.js';
import { createMockGetSet } from './helpers.js';

describe('entity commands', () => {
  it('AddEntityCommand adds entity to document', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const cmd = new AddEntityCommand({ name: 'Ego' }, getDoc, setDoc);
    cmd.execute();

    expect(getLatest().entities).toHaveLength(1);
    expect(getLatest().entities[0].name).toBe('Ego');
    expect(getLatest().entities[0].id).toBeDefined();
  });

  it('AddEntityCommand undo removes entity', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const cmd = new AddEntityCommand({ name: 'Ego' }, getDoc, setDoc);
    cmd.execute();
    expect(getLatest().entities).toHaveLength(1);

    cmd.undo();
    expect(getLatest().entities).toHaveLength(0);
  });

  it('AddEntityCommand redo re-adds entity', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const cmd = new AddEntityCommand({ name: 'Ego' }, getDoc, setDoc);
    cmd.execute();
    cmd.undo();
    cmd.execute();

    expect(getLatest().entities).toHaveLength(1);
    expect(getLatest().entities[0].name).toBe('Ego');
  });

  it('RemoveEntityCommand removes entity', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const addCmd = new AddEntityCommand({ name: 'Ego' }, getDoc, setDoc);
    addCmd.execute();
    const entityId = getLatest().entities[0].id;

    const removeCmd = new RemoveEntityCommand(entityId, getDoc, setDoc);
    removeCmd.execute();
    expect(getLatest().entities).toHaveLength(0);
  });

  it('RemoveEntityCommand undo restores entity at original index', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    new AddEntityCommand({ name: 'First' }, getDoc, setDoc).execute();
    new AddEntityCommand({ name: 'Second' }, getDoc, setDoc).execute();
    new AddEntityCommand({ name: 'Third' }, getDoc, setDoc).execute();

    const secondId = getLatest().entities[1].id;
    const removeCmd = new RemoveEntityCommand(secondId, getDoc, setDoc);
    removeCmd.execute();
    expect(getLatest().entities).toHaveLength(2);

    removeCmd.undo();
    expect(getLatest().entities).toHaveLength(3);
    expect(getLatest().entities[1].name).toBe('Second');
  });

  it('UpdateEntityCommand applies partial updates', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const addCmd = new AddEntityCommand({ name: 'Ego' }, getDoc, setDoc);
    addCmd.execute();
    const entityId = getLatest().entities[0].id;

    const updateCmd = new UpdateEntityCommand(entityId, { name: 'EgoUpdated' }, getDoc, setDoc);
    updateCmd.execute();
    expect(getLatest().entities[0].name).toBe('EgoUpdated');
  });

  it('UpdateEntityCommand undo restores previous state', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const addCmd = new AddEntityCommand({ name: 'Ego' }, getDoc, setDoc);
    addCmd.execute();
    const entityId = getLatest().entities[0].id;

    const updateCmd = new UpdateEntityCommand(entityId, { name: 'EgoUpdated' }, getDoc, setDoc);
    updateCmd.execute();
    expect(getLatest().entities[0].name).toBe('EgoUpdated');

    updateCmd.undo();
    expect(getLatest().entities[0].name).toBe('Ego');
  });

  it('multiple entities can be added and removed', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    new AddEntityCommand({ name: 'A' }, getDoc, setDoc).execute();
    new AddEntityCommand({ name: 'B' }, getDoc, setDoc).execute();
    new AddEntityCommand({ name: 'C' }, getDoc, setDoc).execute();

    expect(getLatest().entities).toHaveLength(3);

    const bId = getLatest().entities[1].id;
    new RemoveEntityCommand(bId, getDoc, setDoc).execute();
    expect(getLatest().entities).toHaveLength(2);
    expect(getLatest().entities.map((e) => e.name)).toEqual(['A', 'C']);
  });
});
