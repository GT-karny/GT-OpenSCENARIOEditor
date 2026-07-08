/**
 * Routing preset factory for junction lane routing.
 *
 * Converts high-level presets ('all', 'dedicated', 'custom') into per-lane
 * turn permission overrides that the connecting road builder consumes.
 */

import type { TurnType, RoadEndpoint } from './connecting-road-builder.js';
import type { EndpointLaneRouting, LaneTurnPermission } from '../store/editor-metadata-types.js';

export type RoutingPreset = 'all' | 'dedicated' | 'custom';

/**
 * Build per-endpoint lane routing overrides for a given preset.
 *
 * @param preset - The routing preset to apply
 * @param endpoints - Road endpoints at the junction
 * @param classifyTurnFn - Function to classify turn type from heading pair
 * @param existingOverrides - Current overrides (returned as-is for 'custom')
 * @returns Array of per-endpoint routing overrides
 */
export function buildRoutingOverrides(
  preset: RoutingPreset,
  endpoints: RoadEndpoint[],
  classifyTurnFn: (inHdg: number, outHdg: number) => TurnType,
  existingOverrides?: EndpointLaneRouting[],
): EndpointLaneRouting[] {
  if (preset === 'all') return [];
  if (preset === 'custom') return existingOverrides ?? [];

  // 'dedicated' preset: assign turn directions based on lane position.
  //
  // The inner/outer → turn-direction mapping mirrors between traffic rules
  // (see docs/development/opendrive-lht-rht.md §6):
  // - RHT: innermost lane = left turn, outermost lane = right turn
  // - LHT: innermost lane = right turn, outermost lane = left turn
  // The rule is carried on each endpoint (RoadEndpoint.trafficRule); default RHT.
  const trafficRule = endpoints[0]?.trafficRule ?? 'RHT';
  const innerTurn: TurnType = trafficRule === 'LHT' ? 'right' : 'left';
  const outerTurn: TurnType = trafficRule === 'LHT' ? 'left' : 'right';

  const result: EndpointLaneRouting[] = [];

  for (const incoming of endpoints) {
    // Collect all possible turn types from this endpoint
    const availableTurns = new Set<TurnType>();
    for (const outgoing of endpoints) {
      if (incoming.roadId === outgoing.roadId) continue;
      const outHdg = outgoing.hdg + Math.PI;
      const turnType = classifyTurnFn(incoming.hdg, outHdg);
      availableTurns.add(turnType);
    }

    const lanes = incoming.drivingLanes;
    const laneCount = lanes.length;
    if (laneCount === 0) continue;

    // Sort lanes inner-to-outer by |id|
    const sorted = [...lanes].sort((a, b) => Math.abs(a.id) - Math.abs(b.id));

    const permissions: LaneTurnPermission[] = [];

    if (laneCount === 1) {
      // Single lane: all available directions
      permissions.push({
        laneId: sorted[0].id,
        allowedTurns: [...availableTurns],
      });
    } else if (laneCount === 2) {
      // 2 lanes: inner=straight+innerTurn, outer=straight+outerTurn
      // (innerTurn/outerTurn mirror between RHT and LHT — see above)
      const innerTurns: TurnType[] = [];
      const outerTurns: TurnType[] = [];
      if (availableTurns.has('straight')) {
        innerTurns.push('straight');
        outerTurns.push('straight');
      }
      if (availableTurns.has(innerTurn)) innerTurns.push(innerTurn);
      if (availableTurns.has(outerTurn)) outerTurns.push(outerTurn);

      permissions.push({ laneId: sorted[0].id, allowedTurns: innerTurns });
      permissions.push({ laneId: sorted[1].id, allowedTurns: outerTurns });
    } else {
      // 3+ lanes: inner=innerTurn, middle=straight, outer=outerTurn
      // Distribute: first lane = innerTurn, last lane = outerTurn, middle = straight
      // (innerTurn/outerTurn mirror between RHT and LHT — see above)
      for (let i = 0; i < sorted.length; i++) {
        const turns: TurnType[] = [];
        if (i === 0) {
          // Innermost lane
          if (availableTurns.has(innerTurn)) turns.push(innerTurn);
          if (availableTurns.has('straight')) turns.push('straight');
        } else if (i === sorted.length - 1) {
          // Outermost lane
          if (availableTurns.has(outerTurn)) turns.push(outerTurn);
          if (availableTurns.has('straight')) turns.push('straight');
        } else {
          // Middle lanes
          if (availableTurns.has('straight')) turns.push('straight');
        }
        permissions.push({ laneId: sorted[i].id, allowedTurns: turns });
      }
    }

    result.push({
      roadId: incoming.roadId,
      contactPoint: incoming.contactPoint,
      lanePermissions: permissions,
    });
  }

  return result;
}
