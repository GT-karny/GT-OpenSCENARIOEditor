import { common as commonEn } from './en/common.js';
import { actions as actionsEn } from './en/actions.js';
import { useCases as useCasesEn } from './en/useCases.js';
import { openscenario as openscenarioEn } from './en/openscenario.js';
import { errors as errorsEn } from './en/errors.js';
import { tooltips as tooltipsEn } from './en/tooltips.js';

import { common as commonJa } from './ja/common.js';
import { actions as actionsJa } from './ja/actions.js';
import { useCases as useCasesJa } from './ja/useCases.js';
import { openscenario as openscenarioJa } from './ja/openscenario.js';
import { errors as errorsJa } from './ja/errors.js';
import { tooltips as tooltipsJa } from './ja/tooltips.js';

export const resources = {
  en: {
    common: commonEn,
    actions: actionsEn,
    useCases: useCasesEn,
    openscenario: openscenarioEn,
    errors: errorsEn,
    tooltips: tooltipsEn,
  },
  ja: {
    common: commonJa,
    actions: actionsJa,
    useCases: useCasesJa,
    openscenario: openscenarioJa,
    errors: errorsJa,
    tooltips: tooltipsJa,
  },
} as const;
