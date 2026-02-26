import type {
  Init,
  InitGlobalAction,
  EntityInitActions,
  InitPrivateAction,
} from '@osce/shared';
import { parsePrivateAction, parseGlobalAction } from './parse-actions.js';
import { ensureArray } from '../utils/ensure-array.js';
import { generateId } from '../utils/uuid.js';
import { strAttr } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseInit(raw: any): Init {
  if (!raw) {
    return { id: generateId(), globalActions: [], entityActions: [] };
  }

  const actions = raw.Actions;
  if (!actions) {
    return { id: generateId(), globalActions: [], entityActions: [] };
  }

  const globalActions: InitGlobalAction[] = ensureArray(actions.GlobalAction).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ga: any) => ({
      id: generateId(),
      action: parseGlobalAction(ga),
    }),
  );

  const entityActions: EntityInitActions[] = ensureArray(actions.Private).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (priv: any) => ({
      id: generateId(),
      entityRef: strAttr(priv, 'entityRef'),
      privateActions: ensureArray(priv.PrivateAction).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (pa: any): InitPrivateAction => ({
          id: generateId(),
          action: parsePrivateAction(pa),
        }),
      ),
    }),
  );

  return { id: generateId(), globalActions, entityActions };
}
