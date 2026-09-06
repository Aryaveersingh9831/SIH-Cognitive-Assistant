// src/components/VoiceMicButton.tsx
import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useVoiceCommands } from '../voice/useVoiceCommands';
import { CommandId } from '../voice/matchCommand';
import { speak } from '../voice/tts';
import { SupportedLanguage } from '../i18n/i18n';
import { colors, radius } from '../theme';

interface VoiceMicButtonProps {
  /**
   * Return the sentence to speak for "read my reminders".
   * In RemindersScreen this should build from the existing `reminders`
   * state (see integration note in the PR description / README).
   */
  getRemindersSpeech: () => string;

  /**
   * Mark the most relevant pending reminder as done (mirrors the
   * existing handleMarkDone in RemindersScreen). Return true if a
   * reminder was actually marked, false if there was nothing pending.
   */
  onMarkDone: () => boolean;
}

export default function VoiceMicButton({ getRemindersSpeech, onMarkDone }: VoiceMicButtonProps) {
  const { t, i18n } = useTranslation();
  const [lastSpoken, setLastSpoken] = useState('');
  const language = i18n.language as SupportedLanguage;

  const handleCommand = (commandId: CommandId) => {
    let responseText = '';
    switch (commandId) {
      case 'READ_REMINDERS':
        responseText = getRemindersSpeech();
        break;
      case 'MARK_DONE': {
        const marked = onMarkDone();
        responseText = marked ? t('tts.markedDoneConfirmed') : t('tts.nothingToMark');
        break;
      }
      case 'REPEAT':
        responseText = lastSpoken || t('tts.nothingToRepeat');
        break;
    }
    setLastSpoken(responseText);
    speak(responseText, language);
  };

  const handleNotUnderstood = () => {
    speak(t('voice.notUnderstood'), language);
  };

  const { state, startListening } = useVoiceCommands({
    onCommand: handleCommand,
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
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 16,
  },
  buttonActive: {
    backgroundColor: colors.error,
  },
  icon: {
    fontSize: 26,
  },
});
