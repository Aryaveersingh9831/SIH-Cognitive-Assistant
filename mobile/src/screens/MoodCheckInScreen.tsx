// MoodCheckInScreen.tsx
// Shown before a game session starts. Feeds an emotional-engagement signal
// to the caregiver dashboard (send alongside the next game-result payload).
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, type, touchTarget } from '../theme';

const MOODS = [
  { key: 'happy', label: 'Happy', symbol: ':)' },
  { key: 'okay', label: 'Okay', symbol: ':|' },
  { key: 'low', label: 'Low', symbol: ':(' },
  { key: 'anxious', label: 'Anxious', symbol: '!' },
];

type Props = {
  onSelect: (moodKey: string) => void;
  onSkip: () => void;
};

export default function MoodCheckInScreen({ onSelect, onSkip }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (key: string) => {
    setSelected(key);
    // small delay so the user sees their selection register before moving on
    setTimeout(() => onSelect(key), 300);
  };

  return (
    <View style={styles.container}>
      <Text style={type.heading}>How are you feeling today?</Text>
      <Text style={[type.bodyMuted, styles.subtitle]}>
        This helps us choose the right activity for you.
      </Text>

      <View style={styles.grid}>
        {MOODS.map((mood) => {
          const isSelected = selected === mood.key;
          return (
            <TouchableOpacity
              key={mood.key}
              style={[styles.tile, isSelected && styles.tileSelected]}
              onPress={() => handleSelect(mood.key)}
            >
              <Text style={styles.symbol}>{mood.symbol}</Text>
              <Text
                style={[styles.tileText, isSelected && styles.tileTextSelected]}
              >
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity onPress={onSkip} style={styles.skipRow}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

// Reusable speaker/mic button — drop this next to instructions, reminders,
// or dashboard summaries so content can be read aloud via TTS.
export function VoiceButton({
  onPress,
  active = false,
}: {
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.voiceButton, active && styles.voiceButtonActive]}
      accessibilityLabel="Read aloud"
    >
      <Text style={[styles.voiceIcon, active && styles.voiceIconActive]}>
        {active ? '((•))' : '(•)'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  tile: {
    width: '47%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget.minHeight + 30,
  },
  tileSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  symbol: {
    fontSize: 22,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  tileText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tileTextSelected: {
    color: colors.surface,
  },
  skipRow: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  skipText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  voiceButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  voiceIcon: {
    fontSize: 14,
    color: colors.text,
  },
  voiceIconActive: {
    color: colors.surface,
  },
});