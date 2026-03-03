import { describe, it, expect } from 'vitest';
import { AddParameterCommand, RemoveParameterCommand, UpdateParameterCommand } from '../commands/parameter-commands.js';
import { createDefaultDocument } from '../store/defaults.js';
import { createMockGetSet } from './helpers.js';

describe('parameter commands', () => {
  it('AddParameterCommand adds parameter to document', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const cmd = new AddParameterCommand({ name: 'EgoSpeed', parameterType: 'double', value: '120' }, getDoc, setDoc);
    cmd.execute();

    expect(getLatest().parameterDeclarations).toHaveLength(1);
    expect(getLatest().parameterDeclarations[0].name).toBe('EgoSpeed');
    expect(getLatest().parameterDeclarations[0].parameterType).toBe('double');
    expect(getLatest().parameterDeclarations[0].value).toBe('120');
    expect(getLatest().parameterDeclarations[0].id).toBeDefined();
  });

  it('AddParameterCommand undo removes parameter', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const cmd = new AddParameterCommand({ name: 'EgoSpeed' }, getDoc, setDoc);
    cmd.execute();
    expect(getLatest().parameterDeclarations).toHaveLength(1);

    cmd.undo();
    expect(getLatest().parameterDeclarations).toHaveLength(0);
  });

  it('AddParameterCommand redo re-adds parameter', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const cmd = new AddParameterCommand({ name: 'EgoSpeed' }, getDoc, setDoc);
    cmd.execute();
    cmd.undo();
    cmd.execute();

    expect(getLatest().parameterDeclarations).toHaveLength(1);
    expect(getLatest().parameterDeclarations[0].name).toBe('EgoSpeed');
  });

  it('RemoveParameterCommand removes parameter', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const addCmd = new AddParameterCommand({ name: 'EgoSpeed' }, getDoc, setDoc);
    addCmd.execute();
    const paramId = getLatest().parameterDeclarations[0].id;

    const removeCmd = new RemoveParameterCommand(paramId, getDoc, setDoc);
    removeCmd.execute();
    expect(getLatest().parameterDeclarations).toHaveLength(0);
  });

  it('RemoveParameterCommand undo restores parameter at original index', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    new AddParameterCommand({ name: 'First' }, getDoc, setDoc).execute();
    new AddParameterCommand({ name: 'Second' }, getDoc, setDoc).execute();
    new AddParameterCommand({ name: 'Third' }, getDoc, setDoc).execute();

    const secondId = getLatest().parameterDeclarations[1].id;
    const removeCmd = new RemoveParameterCommand(secondId, getDoc, setDoc);
    removeCmd.execute();
    expect(getLatest().parameterDeclarations).toHaveLength(2);

    removeCmd.undo();
    expect(getLatest().parameterDeclarations).toHaveLength(3);
    expect(getLatest().parameterDeclarations[1].name).toBe('Second');
  });

  it('UpdateParameterCommand applies partial updates', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const addCmd = new AddParameterCommand({ name: 'EgoSpeed', parameterType: 'double', value: '120' }, getDoc, setDoc);
    addCmd.execute();
    const paramId = getLatest().parameterDeclarations[0].id;

    const updateCmd = new UpdateParameterCommand(paramId, { name: 'TargetSpeed', value: '80' }, getDoc, setDoc);
    updateCmd.execute();
    expect(getLatest().parameterDeclarations[0].name).toBe('TargetSpeed');
    expect(getLatest().parameterDeclarations[0].value).toBe('80');
    expect(getLatest().parameterDeclarations[0].parameterType).toBe('double');
  });

  it('UpdateParameterCommand undo restores previous state', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    const addCmd = new AddParameterCommand({ name: 'EgoSpeed', parameterType: 'double', value: '120' }, getDoc, setDoc);
    addCmd.execute();
    const paramId = getLatest().parameterDeclarations[0].id;

    const updateCmd = new UpdateParameterCommand(paramId, { name: 'TargetSpeed', value: '80' }, getDoc, setDoc);
    updateCmd.execute();
    expect(getLatest().parameterDeclarations[0].name).toBe('TargetSpeed');

    updateCmd.undo();
    expect(getLatest().parameterDeclarations[0].name).toBe('EgoSpeed');
    expect(getLatest().parameterDeclarations[0].value).toBe('120');
  });

  it('multiple parameters can be added and removed', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc, getLatest } = createMockGetSet(doc);

    new AddParameterCommand({ name: 'A' }, getDoc, setDoc).execute();
    new AddParameterCommand({ name: 'B' }, getDoc, setDoc).execute();
    new AddParameterCommand({ name: 'C' }, getDoc, setDoc).execute();

    expect(getLatest().parameterDeclarations).toHaveLength(3);

    const bId = getLatest().parameterDeclarations[1].id;
    new RemoveParameterCommand(bId, getDoc, setDoc).execute();
    expect(getLatest().parameterDeclarations).toHaveLength(2);
    expect(getLatest().parameterDeclarations.map((p) => p.name)).toEqual(['A', 'C']);
  });

  it('getCreatedParameter returns the created parameter', () => {
    const doc = createDefaultDocument();
    const { getDoc, setDoc } = createMockGetSet(doc);

    const cmd = new AddParameterCommand({ name: 'EgoSpeed', parameterType: 'double', value: '120' }, getDoc, setDoc);
    cmd.execute();

    const created = cmd.getCreatedParameter();
    expect(created.name).toBe('EgoSpeed');
    expect(created.parameterType).toBe('double');
    expect(created.value).toBe('120');
    expect(created.id).toBeDefined();
  });
});
