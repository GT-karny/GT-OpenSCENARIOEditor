import type { Init } from '@osce/shared';
import { buildPrivateAction, buildGlobalAction } from './build-actions.js';
import { buildAttrs } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildInit(init: Init): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions: any = {};

  if (init.globalActions.length > 0) {
    actions.GlobalAction = init.globalActions.map((ga) => buildGlobalAction(ga.action));
  }

  if (init.entityActions.length > 0) {
    actions.Private = init.entityActions.map((ea) => ({
      ...buildAttrs({ entityRef: ea.entityRef }),
      PrivateAction: ea.privateActions.map((pa) => buildPrivateAction(pa.action)),
    }));
  }

  return { Actions: actions };
}
