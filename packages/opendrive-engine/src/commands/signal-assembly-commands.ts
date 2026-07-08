/**
 * Commands for signal assembly CRUD operations.
 * Assemblies group multiple signal heads on a single pole and are stored
 * in editor metadata (not in the .xodr file).
 *
 * These commands touch two independent state roots — the OpenDRIVE document
 * (signals) and the editor-metadata assembly list — so they call
 * {@link PatchCommand.mutate} once per root. Patches are recorded per root and
 * inverted in reverse order on undo.
 */

import type { OdrSignal } from '@osce/shared';
import { PatchCommand } from './patch-command.js';
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

export class CreateAssemblyCommand extends PatchCommand {
  private readonly assembly: SignalAssemblyMetadata;
  private readonly getMeta: GetMeta;
  private readonly setMeta: SetMeta;

  constructor(assembly: SignalAssemblyMetadata, getMeta: GetMeta, setMeta: SetMeta) {
    super(`Create signal assembly ${assembly.assemblyId}`);
    this.assembly = assembly;
    this.getMeta = getMeta;
    this.setMeta = setMeta;
  }

  apply(): void {
    this.mutate(this.getMeta, this.setMeta, (draft) => {
      draft.push(this.assembly);
    });
  }

  getCreatedAssembly(): SignalAssemblyMetadata {
    return this.assembly;
  }
}

// ---------------------------------------------------------------------------
// RemoveAssemblyCommand
// ---------------------------------------------------------------------------

export class RemoveAssemblyCommand extends PatchCommand {
  private readonly assemblyId: string;
  private readonly getMeta: GetMeta;
  private readonly setMeta: SetMeta;

  constructor(assemblyId: string, getMeta: GetMeta, setMeta: SetMeta) {
    super(`Remove signal assembly ${assemblyId}`);
    this.assemblyId = assemblyId;
    this.getMeta = getMeta;
    this.setMeta = setMeta;
  }

  apply(): void {
    this.mutate(this.getMeta, this.setMeta, (draft) => {
      const idx = draft.findIndex((a) => a.assemblyId === this.assemblyId);
      if (idx !== -1) draft.splice(idx, 1);
    });
  }
}

// ---------------------------------------------------------------------------
// AddHeadToAssemblyCommand
// ---------------------------------------------------------------------------

export class AddHeadToAssemblyCommand extends PatchCommand {
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

  apply(): void {
    // 1. Add signal to OpenDRIVE document.
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      draft.roads[roadIdx].signals.push(this.signal);
    });

    // 2. Update assembly metadata.
    this.mutate(this.getMeta, this.setMeta, (draft) => {
      const assembly = draft.find((a) => a.assemblyId === this.assemblyId);
      if (!assembly) return;
      assembly.signalIds.push(this.signal.id);
      assembly.headPositions.push({
        signalId: this.signal.id,
        presetId: this.presetId,
        position: this.headPosition,
        offsetY: this.offsetY,
      });
    });
  }

  protected markSideEffects(): void {
    if (findRoadIndex(this.getDoc(), this.roadId) !== -1) {
      this.markDirty(this.roadId);
    }
  }

  getCreatedSignalId(): string {
    return this.signal.id;
  }
}

// ---------------------------------------------------------------------------
// RemoveHeadFromAssemblyCommand
// ---------------------------------------------------------------------------

export class RemoveHeadFromAssemblyCommand extends PatchCommand {
  private readonly assemblyId: string;
  private readonly roadId: string;
  private readonly signalId: string;
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

  apply(): void {
    // 1. Remove signal from OpenDRIVE document.
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const idx = draft.roads[roadIdx].signals.findIndex((s) => s.id === this.signalId);
      if (idx !== -1) draft.roads[roadIdx].signals.splice(idx, 1);
    });

    // 2. Update assembly metadata.
    this.mutate(this.getMeta, this.setMeta, (draft) => {
      const assembly = draft.find((a) => a.assemblyId === this.assemblyId);
      if (!assembly) return;
      const sigIdx = assembly.signalIds.indexOf(this.signalId);
      if (sigIdx !== -1) assembly.signalIds.splice(sigIdx, 1);
      const hpIdx = assembly.headPositions.findIndex((hp) => hp.signalId === this.signalId);
      if (hpIdx !== -1) assembly.headPositions.splice(hpIdx, 1);
    });
  }

  protected markSideEffects(): void {
    if (findRoadIndex(this.getDoc(), this.roadId) !== -1) {
      this.markDirty(this.roadId);
    }
  }
}

// ---------------------------------------------------------------------------
// UpdateAssemblyCommand
// ---------------------------------------------------------------------------

export class UpdateAssemblyCommand extends PatchCommand {
  private readonly assemblyId: string;
  private readonly updates: Partial<
    Pick<SignalAssemblyMetadata, 'poleType' | 'armLength' | 'armAngle'>
  >;
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

  apply(): void {
    this.mutate(this.getMeta, this.setMeta, (draft) => {
      const assembly = draft.find((a) => a.assemblyId === this.assemblyId);
      if (!assembly) return;
      Object.assign(assembly, this.updates);
    });
  }
}
