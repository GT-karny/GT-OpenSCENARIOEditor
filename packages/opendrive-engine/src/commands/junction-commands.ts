/**
 * Commands for junction CRUD operations.
 */

import type { OpenDriveDocument, OdrJunction, OdrJunctionConnection } from '@osce/shared';
import { PatchCommand } from './patch-command.js';
import type { GetDoc, SetDoc } from './road-commands.js';
import { nextNumericId } from '../utils/id-generator.js';
import {
  createJunctionFromDefaults,
  createJunctionConnectionFromDefaults,
} from '../store/defaults.js';

export type MarkDirtyJunction = (junctionId: string) => void;

function findJunctionIndex(doc: OpenDriveDocument, junctionId: string): number {
  return doc.junctions.findIndex((j) => j.id === junctionId);
}

export class AddJunctionCommand extends PatchCommand {
  private readonly junction: OdrJunction;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyJunction;

  constructor(
    partial: Partial<OdrJunction>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyJunction,
  ) {
    const id = partial.id ?? nextNumericId(getDoc().junctions.map((j) => j.id));
    super(`Add junction: ${partial.name ?? id}`);
    const junction = createJunctionFromDefaults(id, partial.name ?? '');
    if (partial.type) junction.type = partial.type;
    if (partial.connections) junction.connections = partial.connections;
    this.junction = junction;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      draft.junctions.push(this.junction);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.junction.id);
  }

  getCreatedJunction(): OdrJunction {
    return this.junction;
  }
}

export class RemoveJunctionCommand extends PatchCommand {
  private readonly junctionId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyJunction;

  constructor(junctionId: string, getDoc: GetDoc, setDoc: SetDoc, markDirty: MarkDirtyJunction) {
    super(`Remove junction: ${junctionId}`);
    this.junctionId = junctionId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const idx = findJunctionIndex(draft, this.junctionId);
      if (idx !== -1) draft.junctions.splice(idx, 1);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.junctionId);
  }
}

export class UpdateJunctionCommand extends PatchCommand {
  private readonly junctionId: string;
  private readonly updates: Partial<OdrJunction>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyJunction;

  constructor(
    junctionId: string,
    updates: Partial<OdrJunction>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyJunction,
  ) {
    super(`Update junction: ${junctionId}`);
    this.junctionId = junctionId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const idx = findJunctionIndex(draft, this.junctionId);
      if (idx === -1) return;
      Object.assign(draft.junctions[idx], this.updates);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.junctionId);
  }
}

export class AddJunctionConnectionCommand extends PatchCommand {
  private readonly junctionId: string;
  private readonly connection: OdrJunctionConnection;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyJunction;

  constructor(
    junctionId: string,
    partial: Partial<OdrJunctionConnection>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyJunction,
  ) {
    const allConnIds = getDoc().junctions.flatMap((j) => j.connections.map((c) => c.id));
    const connId = partial.id ?? nextNumericId(allConnIds);
    super(`Add connection ${connId} to junction ${junctionId}`);
    this.junctionId = junctionId;

    const connection = createJunctionConnectionFromDefaults(
      connId,
      partial.incomingRoad ?? '',
      partial.connectingRoad ?? '',
    );
    if (partial.contactPoint) connection.contactPoint = partial.contactPoint;
    if (partial.laneLinks) connection.laneLinks = partial.laneLinks;
    this.connection = connection;

    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const junction = draft.junctions.find((j) => j.id === this.junctionId);
      if (junction) junction.connections.push(this.connection);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.junctionId);
  }

  getCreatedConnection(): OdrJunctionConnection {
    return this.connection;
  }
}

export class RemoveJunctionConnectionCommand extends PatchCommand {
  private readonly junctionId: string;
  private readonly connectionId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyJunction;

  constructor(
    junctionId: string,
    connectionId: string,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyJunction,
  ) {
    super(`Remove connection ${connectionId} from junction ${junctionId}`);
    this.junctionId = junctionId;
    this.connectionId = connectionId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const jIdx = findJunctionIndex(draft, this.junctionId);
      if (jIdx === -1) return;
      const junction = draft.junctions[jIdx];
      const idx = junction.connections.findIndex((c) => c.id === this.connectionId);
      if (idx !== -1) junction.connections.splice(idx, 1);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.junctionId);
  }
}
