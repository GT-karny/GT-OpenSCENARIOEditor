/**
 * Pure helper functions for road operations.
 */

import type { OpenDriveDocument, OdrRoad } from '@osce/shared';
import { nextNumericId } from '../utils/id-generator.js';

/**
 * Generate a unique numeric road ID based on existing roads in the document.
 */
export function generateRoadId(doc: OpenDriveDocument): string {
  return nextNumericId(doc.roads.map((r) => r.id));
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
