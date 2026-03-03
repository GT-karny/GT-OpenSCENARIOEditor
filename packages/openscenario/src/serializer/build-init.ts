import type { Init } from '@osce/shared';
import { buildPrivateAction, buildGlobalAction } from './build-actions.js';
import { buildAttrs } from '../utils/xml-helpers.js';

type AllBindings = Record<string, Record<string, string>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildInit(init: Init, allBindings: AllBindings = {}): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions: any = {};

  if (init.globalActions.length > 0) {
    actions.GlobalAction = init.globalActions.map((ga) =>
      buildGlobalAction(ga.action, allBindings[ga.id] ?? {}),
    );
  }

  if (init.entityActions.length > 0) {
    actions.Private = init.entityActions.map((ea) => ({
      ...buildAttrs({ entityRef: ea.entityRef }),
      PrivateAction: ea.privateActions.map((pa) =>
        buildPrivateAction(pa.action, allBindings[pa.id] ?? {}),
      ),
    }));
  }

  return { Actions: actions };
}
