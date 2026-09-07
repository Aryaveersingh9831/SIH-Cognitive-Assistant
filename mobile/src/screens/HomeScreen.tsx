// HomeScreen.tsx
// Patient landing screen after login/mood check-in. Deliberately just three
// choices — elderly users need clarity, not a busy grid of options.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, type, touchTarget } from '../theme';
import { VoiceButton } from './MoodCheckInScreen';

type Props = {
  patientName?: string;
  onPlayGame: () => void;
  onReminders: () => void;
  onProgress: () => void;
};

const TILES = [
  {
    key: 'play',
    label: 'Play a Game',
    hint: 'Fun activities to keep your mind active',
  },
  {
    key: 'reminders',
    label: 'My Reminders',
    hint: 'Medicines, water, and appointments',
  },
  {
    key: 'progress',
    label: 'My Progress',
    hint: 'See how you have been doing',
  },
] as const;

export default function HomeScreen({
  patientName,
  onPlayGame,
  onReminders,
  onProgress,
}: Props) {
  const handlers: Record<(typeof TILES)[number]['key'], () => void> = {
    play: onPlayGame,
    reminders: onReminders,
    progress: onProgress,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={type.heading}>
            {patientName ? `Hello, ${patientName}` : 'Hello there'}
          </Text>
          <Text style={[type.bodyMuted, styles.subtitle]}>
            Let's continue where you left off.
          </Text>
        </View>
        <VoiceButton onPress={() => { }} />
      </View>

      <View style={styles.tileList}>
        {TILES.map((tile) => (
          <TouchableOpacity
            key={tile.key}
            style={styles.tile}
            onPress={handlers[tile.key]}
            accessibilityRole="button"
          >
            <View>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileHint}>{tile.hint}</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  tileList: {
    gap: spacing.md,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight + 28,
  },
  tileLabel: {
    fontSize: 19,
    fontWeight: '600',
    color: colors.text,
  },
  tileHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  chevron: {
    fontSize: 20,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
});