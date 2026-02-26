import type { common } from './locales/en/common.js';
import type { actions } from './locales/en/actions.js';
import type { useCases } from './locales/en/useCases.js';
import type { openscenario } from './locales/en/openscenario.js';
import type { errors } from './locales/en/errors.js';
import type { tooltips } from './locales/en/tooltips.js';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      actions: typeof actions;
      useCases: typeof useCases;
      openscenario: typeof openscenario;
      errors: typeof errors;
      tooltips: typeof tooltips;
    };
  }
}
