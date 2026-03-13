/**
 * Pure helper functions for road operations.
 */

import { v4 as uuidv4 } from 'uuid';
import type { OpenDriveDocument, OdrRoad } from '@osce/shared';

/**
 * Generate a unique road ID. OpenDRIVE uses numeric string IDs by convention,
 * but we use UUID internally to avoid collisions during editing.
 * The serializer maps these to sequential numeric IDs on export.
 */
export function generateRoadId(): string {
  return uuidv4();
}

/**
 * Find a road by its ID.
 */
export function findRoadById(doc: OpenDriveDocument, roadId: string): OdrRoad | undefined {
  return doc.roads.find((r) => r.id === roadId);
}

/**
 * Find the index of a road by its ID.
 */
export function findRoadIndex(doc: OpenDriveDocument, roadId: string): number {
  return doc.roads.findIndex((r) => r.id === roadId);
}
