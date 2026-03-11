import { common as commonEn } from './en/common.js';
import { actions as actionsEn } from './en/actions.js';
import { useCases as useCasesEn } from './en/useCases.js';
import { openscenario as openscenarioEn } from './en/openscenario.js';
import { errors as errorsEn } from './en/errors.js';
import { tooltips as tooltipsEn } from './en/tooltips.js';
import { composer as composerEn } from './en/composer.js';

import { common as commonJa } from './ja/common.js';
import { actions as actionsJa } from './ja/actions.js';
import { useCases as useCasesJa } from './ja/useCases.js';
import { openscenario as openscenarioJa } from './ja/openscenario.js';
import { errors as errorsJa } from './ja/errors.js';
import { tooltips as tooltipsJa } from './ja/tooltips.js';
import { composer as composerJa } from './ja/composer.js';

export const resources = {
  en: {
    common: commonEn,
    actions: actionsEn,
    useCases: useCasesEn,
    openscenario: openscenarioEn,
    errors: errorsEn,
    tooltips: tooltipsEn,
    composer: composerEn,
  },
  ja: {
    common: commonJa,
    actions: actionsJa,
    useCases: useCasesJa,
    openscenario: openscenarioJa,
    errors: errorsJa,
    tooltips: tooltipsJa,
    composer: composerJa,
  },
} as const;
