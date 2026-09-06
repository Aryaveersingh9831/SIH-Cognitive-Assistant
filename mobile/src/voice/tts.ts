// src/voice/tts.ts
import * as Speech from 'expo-speech';
import { LANGUAGE_LOCALE_MAP, SupportedLanguage } from '../i18n/i18n';

/**
 * Speaks the given text using the on-device TTS engine, in the correct
 * locale for the given language code ('en' | 'hi' | 'as' | 'bn').
 */
export function speak(text: string, language: SupportedLanguage) {
  const locale = LANGUAGE_LOCALE_MAP[language] ?? 'en-US';
  Speech.stop(); // avoid overlapping speech if something is already talking
  Speech.speak(text, { language: locale });
}

export function stopSpeaking() {
  Speech.stop();
}
