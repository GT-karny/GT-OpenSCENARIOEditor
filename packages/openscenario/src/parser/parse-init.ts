import type {
  Init,
  InitGlobalAction,
  EntityInitActions,
  InitPrivateAction,
} from '@osce/shared';
import type { RawXml } from '../utils/xml-helpers.js';
import { parsePrivateAction, parseGlobalAction } from './parse-actions.js';
import { generateId } from '@osce/shared';
import { strAttr, setBindingElementId, child, children } from '../utils/xml-helpers.js';

export function parseInit(raw: RawXml | undefined): Init {
  if (!raw) {
    return { id: generateId(), globalActions: [], entityActions: [] };
  }

  const actions = child(raw, 'Actions');
  if (!actions) {
    return { id: generateId(), globalActions: [], entityActions: [] };
  }

  const globalActions: InitGlobalAction[] = children(actions, 'GlobalAction').map((ga) => ({
    id: generateId(),
    action: parseGlobalAction(ga),
  }));

  const entityActions: EntityInitActions[] = children(actions, 'Private').map((priv) => ({
    id: generateId(),
    entityRef: strAttr(priv, 'entityRef'),
    privateActions: children(priv, 'PrivateAction').map((pa): InitPrivateAction => {
      const paId = generateId();
      setBindingElementId(paId);
      return { id: paId, action: parsePrivateAction(pa) };
    }),
  }));

  return { id: generateId(), globalActions, entityActions };
}
