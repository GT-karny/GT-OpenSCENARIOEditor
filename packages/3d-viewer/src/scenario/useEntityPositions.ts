/**
 * Hook to extract and resolve entity initial positions from the scenario store.
 * Bridges scenario Init TeleportActions to WorldCoords for 3D rendering.
 */

import { useMemo } from 'react';
import { useStore } from 'zustand';
import type {
  ScenarioDocument,
  OpenDriveDocument,
  EntityInitActions,
} from '@osce/shared';
import { resolvePositionToWorld, type WorldCoords } from '../utils/position-resolver.js';

/**
 * Extract entity positions from Init section of a scenario document.
 * This is a pure function (no hooks) for easier testing.
 */
export function extractEntityPositions(
  doc: ScenarioDocument,
  odrDoc: OpenDriveDocument | null,
): Map<string, WorldCoords> {
  const positions = new Map<string, WorldCoords>();

  for (const entityActions of doc.storyboard.init.entityActions) {
    const position = findTeleportPosition(entityActions);
    if (position) {
      positions.set(entityActions.entityRef, position);
    }
  }

  return positions;

  function findTeleportPosition(
    entityActions: EntityInitActions,
  ): WorldCoords | null {
    for (const initAction of entityActions.privateActions) {
      if (initAction.action.type === 'teleportAction') {
        return resolvePositionToWorld(initAction.action.position, odrDoc);
      }
    }
    return null;
  }
}

/**
 * React hook to subscribe to entity init positions from the scenario store.
 */
export function useEntityPositions(
  store: ReturnType<typeof import('@osce/scenario-engine').createScenarioStore>,
  odrDocument: OpenDriveDocument | null,
): Map<string, WorldCoords> {
  const initEntityActions = useStore(
    store,
    (state: { document: ScenarioDocument }) => state.document.storyboard.init.entityActions,
  );

  return useMemo(
    () => {
      const doc = store.getState().document;
      return extractEntityPositions(doc, odrDocument);
    },
    [initEntityActions, odrDocument, store],
  );
}
