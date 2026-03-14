/**
 * Virtual junction operations.
 *
 * A virtual junction is a lightweight junction that marks a stretch of road
 * (defined by s-coordinate ranges) as a junction area, WITHOUT generating
 * connecting roads. This is used for merge/diverge areas, ramp junctions,
 * or any situation where the junction geometry is already embedded in the
 * existing road geometry.
 *
 * OpenDRIVE type = 'virtual'.
 */

import type { OpenDriveDocument, OdrJunction } from '@osce/shared';
import type { JunctionMetadata } from '../store/editor-metadata-types.js';
import { nextNumericId } from '../utils/id-generator.js';

/**
 * Road reference within a virtual junction.
 */
export interface VirtualJunctionRoadRef {
  /** Road ID. */
  roadId: string;
  /** Start s-coordinate on the road. */
  sStart: number;
  /** End s-coordinate on the road. */
  sEnd: number;
}

/**
 * Parameters for creating a virtual junction.
 */
export interface CreateVirtualJunctionParams {
  /** Roads and their s-ranges that belong to this junction area. */
  roadRefs: VirtualJunctionRoadRef[];
  /** Optional name. */
  name?: string;
}

/**
 * Result of creating a virtual junction.
 */
export interface VirtualJunctionResult {
  junction: OdrJunction;
  junctionMetadata: JunctionMetadata;
}

/**
 * Create a virtual junction from road s-coordinate references.
 *
 * Unlike a normal junction, a virtual junction:
 * - Does NOT generate connecting roads
 * - Does NOT split existing roads
 * - Only marks road segments as belonging to a junction area
 * - Sets junction.type = 'virtual'
 *
 * The roads' `junction` field on the affected segments should be updated
 * by the caller (or via a CompoundCommand).
 */
export function createVirtualJunction(
  doc: OpenDriveDocument,
  params: CreateVirtualJunctionParams,
): VirtualJunctionResult {
  const junctionId = nextNumericId(doc.junctions.map((j) => j.id));

  const junction: OdrJunction = {
    id: junctionId,
    name: params.name ?? `Virtual Junction ${junctionId}`,
    type: 'virtual',
    connections: [],
  };

  const junctionMeta: JunctionMetadata = {
    junctionId,
    intersectingVirtualRoadIds: [],
    connectingRoadIds: [],
    autoCreated: false,
  };

  return { junction, junctionMetadata: junctionMeta };
}

/**
 * Validate a virtual junction's road references against the document.
 * Returns an array of error messages (empty = valid).
 */
export function validateVirtualJunctionRefs(
  doc: OpenDriveDocument,
  roadRefs: VirtualJunctionRoadRef[],
): string[] {
  const errors: string[] = [];

  for (const ref of roadRefs) {
    const road = doc.roads.find((r) => r.id === ref.roadId);
    if (!road) {
      errors.push(`Road ${ref.roadId} not found in document.`);
      continue;
    }
    if (ref.sStart < 0 || ref.sStart > road.length) {
      errors.push(`sStart ${ref.sStart} is out of range for road ${ref.roadId} (length=${road.length}).`);
    }
    if (ref.sEnd < 0 || ref.sEnd > road.length) {
      errors.push(`sEnd ${ref.sEnd} is out of range for road ${ref.roadId} (length=${road.length}).`);
    }
    if (ref.sStart >= ref.sEnd) {
      errors.push(`sStart (${ref.sStart}) must be less than sEnd (${ref.sEnd}) for road ${ref.roadId}.`);
    }
  }

  return errors;
}
