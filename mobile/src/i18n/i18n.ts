// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import as from './locales/as.json';
import bn from './locales/bn.json';

// Matches the codes already used in LanguageSelectScreen.tsx.
export const SUPPORTED_LANGUAGES = ['en', 'hi', 'as', 'bn'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// BCP-47 locale tags for TTS / speech recognition.
// NOTE: on-device Assamese ("as") STT/TTS voice support is not guaranteed
// on all Android devices — verify on the actual target hardware.
export const LANGUAGE_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  as: 'as-IN',
  bn: 'bn-IN',
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    as: { translation: as },
    bn: { translation: bn },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
