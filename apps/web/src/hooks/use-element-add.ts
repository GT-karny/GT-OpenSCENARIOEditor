import { useCallback } from 'react';
import type { OsceNodeType } from '@osce/node-editor';
import { useScenarioStoreApi } from '../stores/use-scenario-store';

/**
 * Hook that provides a dispatch function for adding child nodes.
 * Calls the correct store method based on parent/child relationship.
 */
export function useElementAdd() {
  const storeApi = useScenarioStoreApi();

  const addChildToNode = useCallback(
    (parentId: string | null, childType: OsceNodeType) => {
      const store = storeApi.getState();

      switch (childType) {
        case 'entity':
          store.addEntity({ name: 'NewEntity' });
          break;
        case 'story':
          store.addStory({ name: 'NewStory' });
          break;
        case 'act':
          if (parentId) store.addAct(parentId, { name: 'NewAct' });
          break;
        case 'maneuverGroup':
          if (parentId) store.addManeuverGroup(parentId, { name: 'NewManeuverGroup' });
          break;
        case 'maneuver':
          if (parentId) store.addManeuver(parentId, { name: 'NewManeuver' });
          break;
        case 'event':
          if (parentId) store.addEvent(parentId, { name: 'NewEvent' });
          break;
        case 'action':
          if (parentId) store.addAction(parentId, { name: 'NewAction' });
          break;
      }
    },
    [storeApi],
  );

  return { addChildToNode };
}
