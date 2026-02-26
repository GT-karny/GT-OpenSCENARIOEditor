import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './locales/index.js';

export const defaultNS = 'common' as const;
export const supportedLngs = ['en', 'ja'] as const;
export type SupportedLanguage = (typeof supportedLngs)[number];

export function initI18n(lng: SupportedLanguage = 'en') {
  return i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    defaultNS,
    ns: ['common', 'actions', 'useCases', 'openscenario', 'errors', 'tooltips'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });
}

export { i18n };
