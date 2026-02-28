import type { OsceNodeType } from '@osce/node-editor';

export interface AddChildOption {
  childType: OsceNodeType;
  i18nKey: string;
  i18nFallback: string;
}

/**
 * Given a node type, return the child types that can be added to it.
 * Returns empty array for leaf nodes and structural-only nodes.
 */
export function getAddChildOptions(nodeType: OsceNodeType): AddChildOption[] {
  switch (nodeType) {
    case 'storyboard':
      return [{ childType: 'story', i18nKey: 'contextMenu.addStory', i18nFallback: 'Add Story' }];
    case 'story':
      return [{ childType: 'act', i18nKey: 'contextMenu.addAct', i18nFallback: 'Add Act' }];
    case 'act':
      return [{ childType: 'maneuverGroup', i18nKey: 'contextMenu.addManeuverGroup', i18nFallback: 'Add ManeuverGroup' }];
    case 'maneuverGroup':
      return [{ childType: 'maneuver', i18nKey: 'contextMenu.addManeuver', i18nFallback: 'Add Maneuver' }];
    case 'maneuver':
      return [{ childType: 'event', i18nKey: 'contextMenu.addEvent', i18nFallback: 'Add Event' }];
    case 'event':
      return [{ childType: 'action', i18nKey: 'contextMenu.addAction', i18nFallback: 'Add Action' }];
    default:
      return [];
  }
}

/** Options shown when right-clicking the empty canvas (no node). */
export const paneAddOptions: AddChildOption[] = [
  { childType: 'entity', i18nKey: 'contextMenu.addEntity', i18nFallback: 'Add Entity' },
  { childType: 'story', i18nKey: 'contextMenu.addStory', i18nFallback: 'Add Story' },
];

/** Node types that cannot be deleted by the user. */
export const NON_DELETABLE_TYPES: ReadonlySet<OsceNodeType> = new Set([
  'storyboard',
  'init',
  'trigger',
]);
