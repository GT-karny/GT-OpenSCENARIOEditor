/**
 * Commands for scenario-level property updates.
 * Handles FileHeader, RoadNetwork, and CatalogLocations.
 */

import { produce } from 'immer';
import type { FileHeader, RoadNetwork, CatalogLocations } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import type { GetDoc, SetDoc } from './entity-commands.js';

export class UpdateFileHeaderCommand extends BaseCommand {
  private previousHeader: FileHeader | null = null;
  private readonly updates: Partial<FileHeader>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(updates: Partial<FileHeader>, getDoc: GetDoc, setDoc: SetDoc) {
    super('Update file header');
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.previousHeader = structuredClone(doc.fileHeader);
    this.setDoc(
      produce(doc, (draft) => {
        Object.assign(draft.fileHeader, this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousHeader) return;
    const prev = this.previousHeader;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        draft.fileHeader = prev;
      }),
    );
  }
}

export class UpdateRoadNetworkCommand extends BaseCommand {
  private previousRoadNetwork: RoadNetwork | null = null;
  private readonly updates: Partial<RoadNetwork>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(updates: Partial<RoadNetwork>, getDoc: GetDoc, setDoc: SetDoc) {
    super('Update road network');
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.previousRoadNetwork = structuredClone(doc.roadNetwork);
    this.setDoc(
      produce(doc, (draft) => {
        Object.assign(draft.roadNetwork, this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousRoadNetwork) return;
    const prev = this.previousRoadNetwork;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        draft.roadNetwork = prev;
      }),
    );
  }
}

export class UpdateCatalogLocationsCommand extends BaseCommand {
  private previousLocations: CatalogLocations | null = null;
  private readonly updates: Partial<CatalogLocations>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(updates: Partial<CatalogLocations>, getDoc: GetDoc, setDoc: SetDoc) {
    super('Update catalog locations');
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.previousLocations = structuredClone(doc.catalogLocations);
    this.setDoc(
      produce(doc, (draft) => {
        Object.assign(draft.catalogLocations, this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousLocations) return;
    const prev = this.previousLocations;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        draft.catalogLocations = prev;
      }),
    );
  }
}
