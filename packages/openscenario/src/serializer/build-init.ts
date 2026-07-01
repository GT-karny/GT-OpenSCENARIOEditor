import type { Init } from '@osce/shared';
import { buildPrivateAction, buildGlobalAction } from './build-actions.js';
import { buildAttrs } from '../utils/xml-helpers.js';

type AllBindings = Record<string, Record<string, string>>;

export function buildInit(init: Init, allBindings: AllBindings = {}): Record<string, unknown> {
  const actions: Record<string, unknown> = {};

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
