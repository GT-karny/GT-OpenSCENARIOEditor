import { describe, it, expect, beforeEach } from 'vitest';
import type { OpenDriveDocument, OdrSignal } from '@osce/shared';
import { CommandHistory } from '@osce/scenario-engine';
import {
  CreateAssemblyCommand,
  RemoveAssemblyCommand,
  AddHeadToAssemblyCommand,
  RemoveHeadFromAssemblyCommand,
  UpdateAssemblyCommand,
} from '../../commands/signal-assembly-commands.js';
import type { SignalAssemblyMetadata } from '../../store/editor-metadata-types.js';
import { createTestDocument, createTestRoad } from '../helpers.js';

/**
 * Signal-assembly commands operate on TWO state roots: the OpenDRIVE document
 * (signals) and the editor-metadata assembly list. These tests verify the
 * patch-based base inverts both roots correctly and that redo replays them.
 */
describe('Signal Assembly Commands (patch-based, two-root)', () => {
  let doc: OpenDriveDocument;
  let assemblies: SignalAssemblyMetadata[];
  let history: CommandHistory;
  const dirty: string[] = [];

  const getDoc = () => doc;
  const setDoc = (d: OpenDriveDocument) => {
    doc = d;
  };
  const getMeta = () => assemblies;
  const setMeta = (a: SignalAssemblyMetadata[]) => {
    assemblies = a;
  };
  const markDirty = (id: string) => {
    dirty.push(id);
  };

  const refSignal: OdrSignal = { id: 'ref', s: 10, t: -2, orientation: '+', zOffset: 4 };

  function baseAssembly(): SignalAssemblyMetadata {
    return {
      assemblyId: 'asm-1',
      roadId: 'road-1',
      signalIds: [],
      poleType: 'arm',
      armLength: 3,
      headPositions: [],
    };
  }

  beforeEach(() => {
    doc = createTestDocument();
    doc.roads.push(createTestRoad({ id: 'road-1', name: 'R1', signals: [refSignal] }));
    assemblies = [];
    history = new CommandHistory();
    dirty.length = 0;
  });

  describe('CreateAssemblyCommand', () => {
    it('adds, undoes, and redoes the assembly byte-identically', () => {
      const before = structuredClone(assemblies);
      const cmd = new CreateAssemblyCommand(baseAssembly(), getMeta, setMeta);

      history.execute(cmd);
      expect(assemblies).toHaveLength(1);
      const afterAdd = structuredClone(assemblies);

      history.undo();
      expect(assemblies).toEqual(before);

      history.redo();
      expect(assemblies).toEqual(afterAdd);
    });
  });

  describe('RemoveAssemblyCommand', () => {
    it('removes and restores the assembly at its original position', () => {
      assemblies = [baseAssembly(), { ...baseAssembly(), assemblyId: 'asm-2' }];
      const before = structuredClone(assemblies);

      const cmd = new RemoveAssemblyCommand('asm-1', getMeta, setMeta);
      history.execute(cmd);
      expect(assemblies.map((a) => a.assemblyId)).toEqual(['asm-2']);

      history.undo();
      expect(assemblies).toEqual(before);
    });
  });

  describe('AddHeadToAssemblyCommand', () => {
    beforeEach(() => {
      assemblies = [baseAssembly()];
    });

    it('adds a signal to the doc and a head to metadata, then fully reverts both', () => {
      const docBefore = structuredClone(doc);
      const metaBefore = structuredClone(assemblies);

      const cmd = new AddHeadToAssemblyCommand(
        'asm-1',
        'road-1',
        'preset-x',
        'arm',
        1.5,
        refSignal,
        getMeta,
        setMeta,
        getDoc,
        setDoc,
        markDirty,
      );
      const newId = cmd.getCreatedSignalId();

      history.execute(cmd);
      // Signal appended to the road.
      expect(doc.roads[0].signals.some((s) => s.id === newId)).toBe(true);
      // Metadata updated with the head + signalId.
      expect(assemblies[0].signalIds).toContain(newId);
      expect(assemblies[0].headPositions.some((hp) => hp.signalId === newId)).toBe(true);
      expect(dirty).toContain('road-1');

      const docAfter = structuredClone(doc);
      const metaAfter = structuredClone(assemblies);

      // Undo reverts BOTH roots byte-identically.
      history.undo();
      expect(doc).toEqual(docBefore);
      expect(assemblies).toEqual(metaBefore);

      // Redo re-applies BOTH byte-identically.
      history.redo();
      expect(doc).toEqual(docAfter);
      expect(assemblies).toEqual(metaAfter);
    });
  });

  describe('RemoveHeadFromAssemblyCommand', () => {
    it('removes a head + its signal and restores both on undo', () => {
      // Seed a road signal and an assembly referencing it.
      const headSignal: OdrSignal = { id: 'head-1', s: 10, t: -2, orientation: '+', zOffset: 4 };
      doc.roads[0].signals.push(headSignal);
      assemblies = [
        {
          ...baseAssembly(),
          signalIds: ['head-1'],
          headPositions: [{ signalId: 'head-1', presetId: 'p', position: 'arm' }],
        },
      ];
      const docBefore = structuredClone(doc);
      const metaBefore = structuredClone(assemblies);

      const cmd = new RemoveHeadFromAssemblyCommand(
        'asm-1',
        'road-1',
        'head-1',
        getMeta,
        setMeta,
        getDoc,
        setDoc,
        markDirty,
      );

      history.execute(cmd);
      expect(doc.roads[0].signals.some((s) => s.id === 'head-1')).toBe(false);
      expect(assemblies[0].signalIds).not.toContain('head-1');
      expect(assemblies[0].headPositions).toHaveLength(0);

      history.undo();
      expect(doc).toEqual(docBefore);
      expect(assemblies).toEqual(metaBefore);
    });
  });

  describe('UpdateAssemblyCommand', () => {
    it('updates pole fields and restores prior values on undo', () => {
      assemblies = [baseAssembly()];
      const before = structuredClone(assemblies);

      const cmd = new UpdateAssemblyCommand(
        'asm-1',
        { poleType: 'straight', armLength: 9, armAngle: 0.25 },
        getMeta,
        setMeta,
      );

      history.execute(cmd);
      expect(assemblies[0].poleType).toBe('straight');
      expect(assemblies[0].armLength).toBe(9);
      expect(assemblies[0].armAngle).toBe(0.25);
      const after = structuredClone(assemblies);

      history.undo();
      expect(assemblies).toEqual(before);

      history.redo();
      expect(assemblies).toEqual(after);
    });
  });
});
