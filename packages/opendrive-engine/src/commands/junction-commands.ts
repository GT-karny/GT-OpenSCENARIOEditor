/**
 * Commands for junction CRUD operations.
 */

import { produce } from 'immer';
import type { OpenDriveDocument, OdrJunction, OdrJunctionConnection } from '@osce/shared';
import { BaseCommand } from './base-command.js';
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

export class AddJunctionCommand extends BaseCommand {
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

  execute(): void {
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        draft.junctions.push(this.junction);
      }),
    );
    this.markDirty(this.junction.id);
  }

  undo(): void {
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const idx = findJunctionIndex(draft, this.junction.id);
        if (idx !== -1) draft.junctions.splice(idx, 1);
      }),
    );
    this.markDirty(this.junction.id);
  }

  getCreatedJunction(): OdrJunction {
    return this.junction;
  }
}

export class RemoveJunctionCommand extends BaseCommand {
  private removedJunction: OdrJunction | null = null;
  private removedIndex = -1;
  private readonly junctionId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyJunction;

  constructor(
    junctionId: string,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyJunction,
  ) {
    super(`Remove junction: ${junctionId}`);
    this.junctionId = junctionId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  execute(): void {
    const doc = this.getDoc();
    this.removedIndex = findJunctionIndex(doc, this.junctionId);
    if (this.removedIndex !== -1) {
      this.removedJunction = structuredClone(doc.junctions[this.removedIndex]);
    }
    this.setDoc(
      produce(doc, (draft) => {
        if (this.removedIndex !== -1) draft.junctions.splice(this.removedIndex, 1);
      }),
    );
    this.markDirty(this.junctionId);
  }

  undo(): void {
    if (!this.removedJunction || this.removedIndex === -1) return;
    const junction = this.removedJunction;
    const idx = this.removedIndex;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        draft.junctions.splice(idx, 0, junction);
      }),
    );
    this.markDirty(this.junctionId);
  }
}

export class UpdateJunctionCommand extends BaseCommand {
  private previousJunction: OdrJunction | null = null;
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

  execute(): void {
    const doc = this.getDoc();
    const idx = findJunctionIndex(doc, this.junctionId);
    if (idx === -1) return;
    this.previousJunction = structuredClone(doc.junctions[idx]);
    this.setDoc(
      produce(doc, (draft) => {
        Object.assign(draft.junctions[idx], this.updates);
      }),
    );
    this.markDirty(this.junctionId);
  }

  undo(): void {
    if (!this.previousJunction) return;
    const prev = this.previousJunction;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const idx = findJunctionIndex(draft, this.junctionId);
        if (idx !== -1) draft.junctions[idx] = prev;
      }),
    );
    this.markDirty(this.junctionId);
  }
}

export class AddJunctionConnectionCommand extends BaseCommand {
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

  execute(): void {
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const junction = draft.junctions.find((j) => j.id === this.junctionId);
        if (junction) junction.connections.push(this.connection);
      }),
    );
    this.markDirty(this.junctionId);
  }

  undo(): void {
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const junction = draft.junctions.find((j) => j.id === this.junctionId);
        if (junction) {
          const idx = junction.connections.findIndex((c) => c.id === this.connection.id);
          if (idx !== -1) junction.connections.splice(idx, 1);
        }
      }),
    );
    this.markDirty(this.junctionId);
  }

  getCreatedConnection(): OdrJunctionConnection {
    return this.connection;
  }
}

export class RemoveJunctionConnectionCommand extends BaseCommand {
  private removedConnection: OdrJunctionConnection | null = null;
  private removedIndex = -1;
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

  execute(): void {
    const doc = this.getDoc();
    const jIdx = findJunctionIndex(doc, this.junctionId);
    if (jIdx === -1) return;
    const junction = doc.junctions[jIdx];
    this.removedIndex = junction.connections.findIndex((c) => c.id === this.connectionId);
    if (this.removedIndex !== -1) {
      this.removedConnection = structuredClone(junction.connections[this.removedIndex]);
    }

    this.setDoc(
      produce(doc, (draft) => {
        const j = draft.junctions[jIdx];
        if (this.removedIndex !== -1) j.connections.splice(this.removedIndex, 1);
      }),
    );
    this.markDirty(this.junctionId);
  }

  undo(): void {
    if (!this.removedConnection || this.removedIndex === -1) return;
    const conn = this.removedConnection;
    const idx = this.removedIndex;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const junction = draft.junctions.find((j) => j.id === this.junctionId);
        if (junction) junction.connections.splice(idx, 0, conn);
      }),
    );
    this.markDirty(this.junctionId);
  }
}
