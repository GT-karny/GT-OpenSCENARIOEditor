/**
 * Commands for signal assembly CRUD operations.
 * Assemblies group multiple signal heads on a single pole and are stored
 * in editor metadata (not in the .xodr file).
 */

import { produce } from 'immer';
import type { OdrSignal } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import type { GetDoc, SetDoc, MarkDirtyRoad } from './road-commands.js';
import type { SignalAssemblyMetadata } from '../store/editor-metadata-types.js';
import { findRoadIndex } from '../operations/road-operations.js';
import { createSignalFromDefaults } from '../store/defaults.js';
import { nextNumericId } from '../utils/id-generator.js';
import { presetToSignalPartial } from '../signal/preset-to-signal.js';

// --- Metadata accessors (editor metadata store) ---

export type GetMeta = () => SignalAssemblyMetadata[];
export type SetMeta = (assemblies: SignalAssemblyMetadata[]) => void;

// ---------------------------------------------------------------------------
// CreateAssemblyCommand
// ---------------------------------------------------------------------------

export class CreateAssemblyCommand extends BaseCommand {
  private readonly assembly: SignalAssemblyMetadata;
  private readonly getMeta: GetMeta;
  private readonly setMeta: SetMeta;

  constructor(
    assembly: SignalAssemblyMetadata,
    getMeta: GetMeta,
    setMeta: SetMeta,
  ) {
    super(`Create signal assembly ${assembly.assemblyId}`);
    this.assembly = assembly;
    this.getMeta = getMeta;
    this.setMeta = setMeta;
  }

  execute(): void {
    const current = this.getMeta();
    this.setMeta([...current, this.assembly]);
  }

  undo(): void {
    const current = this.getMeta();
    this.setMeta(current.filter((a) => a.assemblyId !== this.assembly.assemblyId));
  }

  getCreatedAssembly(): SignalAssemblyMetadata {
    return this.assembly;
  }
}

// ---------------------------------------------------------------------------
// RemoveAssemblyCommand
// ---------------------------------------------------------------------------

export class RemoveAssemblyCommand extends BaseCommand {
  private readonly assemblyId: string;
  private removedAssembly: SignalAssemblyMetadata | null = null;
  private removedIndex = -1;
  private readonly getMeta: GetMeta;
  private readonly setMeta: SetMeta;

  constructor(assemblyId: string, getMeta: GetMeta, setMeta: SetMeta) {
    super(`Remove signal assembly ${assemblyId}`);
    this.assemblyId = assemblyId;
    this.getMeta = getMeta;
    this.setMeta = setMeta;
  }

  execute(): void {
    const current = this.getMeta();
    this.removedIndex = current.findIndex((a) => a.assemblyId === this.assemblyId);
    if (this.removedIndex !== -1) {
      this.removedAssembly = structuredClone(current[this.removedIndex]);
    }
    this.setMeta(current.filter((a) => a.assemblyId !== this.assemblyId));
  }

  undo(): void {
    if (!this.removedAssembly || this.removedIndex === -1) return;
    const current = this.getMeta();
    const restored = [...current];
    restored.splice(this.removedIndex, 0, this.removedAssembly);
    this.setMeta(restored);
  }
}

// ---------------------------------------------------------------------------
// AddHeadToAssemblyCommand
// ---------------------------------------------------------------------------

export class AddHeadToAssemblyCommand extends BaseCommand {
  private readonly assemblyId: string;
  private readonly roadId: string;
  private readonly signal: OdrSignal;
  private readonly presetId: string;
  private readonly headPosition: string;
  private readonly offsetY?: number;
  private readonly getMeta: GetMeta;
  private readonly setMeta: SetMeta;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    assemblyId: string,
    roadId: string,
    presetId: string,
    headPosition: 'top' | 'arm' | 'lower',
    offsetY: number | undefined,
    refSignal: OdrSignal,
    getMeta: GetMeta,
    setMeta: SetMeta,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    const allSignalIds = getDoc().roads.flatMap((r) => r.signals.map((s) => s.id));
    const id = nextNumericId(allSignalIds);
    super(`Add head ${id} to assembly ${assemblyId}`);
    this.assemblyId = assemblyId;
    this.roadId = roadId;
    this.presetId = presetId;
    this.headPosition = headPosition;
    this.offsetY = offsetY;

    // Create signal at same s/t as reference signal
    this.signal = {
      ...createSignalFromDefaults(id),
      ...presetToSignalPartial({ id: presetId } as never),
      s: refSignal.s,
      t: refSignal.t,
      zOffset: refSignal.zOffset,
      orientation: refSignal.orientation,
      id,
    };

    this.getMeta = getMeta;
    this.setMeta = setMeta;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  execute(): void {
    // 1. Add signal to OpenDRIVE document
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.setDoc(
      produce(doc, (draft) => {
        draft.roads[roadIdx].signals.push(this.signal);
      }),
    );
    this.markDirty(this.roadId);

    // 2. Update assembly metadata
    const assemblies = this.getMeta();
    this.setMeta(
      assemblies.map((a) =>
        a.assemblyId === this.assemblyId
          ? {
              ...a,
              signalIds: [...a.signalIds, this.signal.id],
              headPositions: [
                ...a.headPositions,
                {
                  signalId: this.signal.id,
                  presetId: this.presetId,
                  position: this.headPosition,
                  offsetY: this.offsetY,
                },
              ],
            }
          : a,
      ),
    );
  }

  undo(): void {
    // 1. Remove signal from OpenDRIVE document
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx !== -1) {
      this.setDoc(
        produce(doc, (draft) => {
          const idx = draft.roads[roadIdx].signals.findIndex((s) => s.id === this.signal.id);
          if (idx !== -1) draft.roads[roadIdx].signals.splice(idx, 1);
        }),
      );
      this.markDirty(this.roadId);
    }

    // 2. Remove from assembly metadata
    const assemblies = this.getMeta();
    this.setMeta(
      assemblies.map((a) =>
        a.assemblyId === this.assemblyId
          ? {
              ...a,
              signalIds: a.signalIds.filter((id) => id !== this.signal.id),
              headPositions: a.headPositions.filter((hp) => hp.signalId !== this.signal.id),
            }
          : a,
      ),
    );
  }

  getCreatedSignalId(): string {
    return this.signal.id;
  }
}

// ---------------------------------------------------------------------------
// RemoveHeadFromAssemblyCommand
// ---------------------------------------------------------------------------

export class RemoveHeadFromAssemblyCommand extends BaseCommand {
  private readonly assemblyId: string;
  private readonly roadId: string;
  private readonly signalId: string;
  private removedSignal: OdrSignal | null = null;
  private removedSignalIndex = -1;
  private removedHeadPosition: SignalAssemblyMetadata['headPositions'][0] | null = null;
  private readonly getMeta: GetMeta;
  private readonly setMeta: SetMeta;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    assemblyId: string,
    roadId: string,
    signalId: string,
    getMeta: GetMeta,
    setMeta: SetMeta,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    super(`Remove head ${signalId} from assembly ${assemblyId}`);
    this.assemblyId = assemblyId;
    this.roadId = roadId;
    this.signalId = signalId;
    this.getMeta = getMeta;
    this.setMeta = setMeta;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  execute(): void {
    // 1. Capture and remove signal from OpenDRIVE document
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx !== -1) {
      this.removedSignalIndex = doc.roads[roadIdx].signals.findIndex(
        (s) => s.id === this.signalId,
      );
      if (this.removedSignalIndex !== -1) {
        this.removedSignal = structuredClone(doc.roads[roadIdx].signals[this.removedSignalIndex]);
      }
      this.setDoc(
        produce(doc, (draft) => {
          if (this.removedSignalIndex !== -1) {
            draft.roads[roadIdx].signals.splice(this.removedSignalIndex, 1);
          }
        }),
      );
      this.markDirty(this.roadId);
    }

    // 2. Update assembly metadata
    const assemblies = this.getMeta();
    for (const a of assemblies) {
      if (a.assemblyId === this.assemblyId) {
        const hp = a.headPositions.find((h) => h.signalId === this.signalId);
        if (hp) this.removedHeadPosition = structuredClone(hp);
      }
    }
    this.setMeta(
      assemblies.map((a) =>
        a.assemblyId === this.assemblyId
          ? {
              ...a,
              signalIds: a.signalIds.filter((id) => id !== this.signalId),
              headPositions: a.headPositions.filter((hp) => hp.signalId !== this.signalId),
            }
          : a,
      ),
    );
  }

  undo(): void {
    // 1. Restore signal in OpenDRIVE document
    if (this.removedSignal && this.removedSignalIndex !== -1) {
      const doc = this.getDoc();
      const roadIdx = findRoadIndex(doc, this.roadId);
      if (roadIdx !== -1) {
        const signal = this.removedSignal;
        const idx = this.removedSignalIndex;
        this.setDoc(
          produce(doc, (draft) => {
            draft.roads[roadIdx].signals.splice(idx, 0, signal);
          }),
        );
        this.markDirty(this.roadId);
      }
    }

    // 2. Restore head in assembly metadata
    if (this.removedHeadPosition) {
      const hp = this.removedHeadPosition;
      const assemblies = this.getMeta();
      this.setMeta(
        assemblies.map((a) =>
          a.assemblyId === this.assemblyId
            ? {
                ...a,
                signalIds: [...a.signalIds, this.signalId],
                headPositions: [...a.headPositions, hp],
              }
            : a,
        ),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// UpdateAssemblyCommand
// ---------------------------------------------------------------------------

export class UpdateAssemblyCommand extends BaseCommand {
  private readonly assemblyId: string;
  private readonly updates: Partial<Pick<SignalAssemblyMetadata, 'poleType' | 'armLength' | 'armAngle'>>;
  private previousValues: Partial<Pick<SignalAssemblyMetadata, 'poleType' | 'armLength' | 'armAngle'>> | null =
    null;
  private readonly getMeta: GetMeta;
  private readonly setMeta: SetMeta;

  constructor(
    assemblyId: string,
    updates: Partial<Pick<SignalAssemblyMetadata, 'poleType' | 'armLength' | 'armAngle'>>,
    getMeta: GetMeta,
    setMeta: SetMeta,
  ) {
    super(`Update assembly ${assemblyId}`);
    this.assemblyId = assemblyId;
    this.updates = updates;
    this.getMeta = getMeta;
    this.setMeta = setMeta;
  }

  execute(): void {
    const assemblies = this.getMeta();
    const assembly = assemblies.find((a) => a.assemblyId === this.assemblyId);
    if (!assembly) return;

    // Capture previous values for undo
    this.previousValues = {
      poleType: assembly.poleType,
      armLength: assembly.armLength,
      armAngle: assembly.armAngle,
    };

    this.setMeta(
      assemblies.map((a) => (a.assemblyId === this.assemblyId ? { ...a, ...this.updates } : a)),
    );
  }

  undo(): void {
    if (!this.previousValues) return;
    const prev = this.previousValues;
    const assemblies = this.getMeta();
    this.setMeta(
      assemblies.map((a) => (a.assemblyId === this.assemblyId ? { ...a, ...prev } : a)),
    );
  }
}
