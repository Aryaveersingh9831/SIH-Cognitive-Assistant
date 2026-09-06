// src/voice/useVoiceCommands.ts
import { useCallback, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useTranslation } from 'react-i18next';

import { LANGUAGE_LOCALE_MAP, SupportedLanguage } from '../i18n/i18n';
import { matchCommand, CommandId } from './matchCommand';

export type VoiceCommandState = 'idle' | 'listening' | 'processing';

interface UseVoiceCommandsOptions {
  onCommand: (commandId: CommandId, rawTranscript: string) => void;
  onNotUnderstood?: (rawTranscript: string) => void;
}

/**
 * Wraps expo-speech-recognition to listen for one of the app's fixed
 * voice commands. Requires a dev-client build (already present in this
 * repo via expo-dev-client) — will NOT work in plain Expo Go.
 */
export function useVoiceCommands({ onCommand, onNotUnderstood }: UseVoiceCommandsOptions) {
  const { i18n } = useTranslation();
  const [state, setState] = useState<VoiceCommandState>('idle');
  const [lastTranscript, setLastTranscript] = useState('');

  useSpeechRecognitionEvent('start', () => setState('listening'));
  useSpeechRecognitionEvent('end', () => setState('idle'));
  useSpeechRecognitionEvent('error', (event) => {
    console.warn('[useVoiceCommands] error:', event.error, event.message);
    setState('idle');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (!transcript) return;

    setLastTranscript(transcript);
    setState('processing');

    const language = i18n.language as SupportedLanguage;
    const matched = matchCommand(transcript, language);

    if (matched) {
      onCommand(matched, transcript);
    } else {
      onNotUnderstood?.(transcript);
    }
    setState('idle');
  });

  const startListening = useCallback(async () => {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      console.warn('[useVoiceCommands] permission denied');
      return;
    }
    const language = i18n.language as SupportedLanguage;
    const locale = LANGUAGE_LOCALE_MAP[language] ?? 'en-US';

    ExpoSpeechRecognitionModule.start({
      lang: locale,
      interimResults: false,
      continuous: false,
      maxAlternatives: 1,
    });
  }, [i18n.language]);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  return { state, lastTranscript, startListening, stopListening };
}
