export { initI18n, i18n, defaultNS, supportedLngs } from './config.js';
export type { SupportedLanguage } from './config.js';
export { resources } from './locales/index.js';

// Re-export react-i18next hooks for convenience
export { useTranslation, Trans, I18nextProvider } from 'react-i18next';

// Type augmentation is auto-applied via side-effect import
import './types.js';
