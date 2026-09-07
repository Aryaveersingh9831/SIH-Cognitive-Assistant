// src/components/VoiceMicButton.tsx
import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useVoiceCommands } from '../voice/useVoiceCommands';
import { CommandId } from '../voice/matchCommand';
import { speak } from '../voice/tts';
import { SupportedLanguage } from '../i18n/i18n';
import { colors, radius } from '../theme';

interface VoiceMicButtonProps {
  /**
   * Called whenever a fixed voice command ('READ_REMINDERS' | 'MARK_DONE' | 'REPEAT')
   * is recognized. This component is intentionally feature-agnostic — the
   * consumer decides what each command means and what to do/speak next.
   * See Issue #11 for how the Reminders screen wires these to real data.
   */
  onCommand: (commandId: CommandId, rawTranscript: string) => void;
}

export default function VoiceMicButton({ onCommand }: VoiceMicButtonProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;

  const handleNotUnderstood = () => {
    speak(t('voice.notUnderstood'), language);
  };

  const { state, startListening } = useVoiceCommands({
    onCommand,
    onNotUnderstood: handleNotUnderstood,
  });

  return (
    <Pressable
      onPress={startListening}
      style={[styles.button, state === 'listening' && styles.buttonActive]}
      accessibilityLabel={t('voice.micLabel')}
    >
      {state === 'listening' || state === 'processing' ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text style={styles.icon}>🎤</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: colors.error,
  },
  icon: {
    fontSize: 24,
  },
});