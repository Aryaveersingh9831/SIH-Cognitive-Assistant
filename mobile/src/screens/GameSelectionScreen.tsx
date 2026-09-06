// GameSelectionScreen.tsx
// Lists the four cognitive games. This screen only handles navigation —
// each game's actual mechanics live in its own screen (teammate's scope).
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius, type, touchTarget } from '../theme';

export type GameType = 'MEMORY' | 'ATTENTION' | 'PATTERN' | 'ROUTINE';

type Props = {
  onSelectGame: (gameType: GameType) => void;
  onBack: () => void;
};

const GAMES: { key: GameType; label: string; description: string; symbol: string }[] = [
  {
    key: 'MEMORY',
    label: 'Memory Game',
    description: 'Look at a few objects, then recall them.',
    symbol: 'M',
  },
  {
    key: 'ATTENTION',
    label: 'Attention Game',
    description: 'Spot and count the matching objects.',
    symbol: 'A',
  },
  {
    key: 'PATTERN',
    label: 'Pattern Game',
    description: 'Find what comes next in the sequence.',
    symbol: 'P',
  },
  {
    key: 'ROUTINE',
    label: 'Daily Routine',
    description: 'Put everyday steps back in order.',
    symbol: 'R',
  },
];

export default function GameSelectionScreen({ onSelectGame, onBack }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityRole="button">
        <Text style={styles.backText}>{'< Back'}</Text>
      </TouchableOpacity>

      <Text style={type.heading}>Choose a Game</Text>
      <Text style={[type.bodyMuted, styles.subtitle]}>
        Pick any activity you'd like to try today.
      </Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {GAMES.map((game) => (
          <TouchableOpacity
            key={game.key}
            style={styles.card}
            onPress={() => onSelectGame(game.key)}
            accessibilityRole="button"
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>{game.symbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>{game.label}</Text>
              <Text style={styles.cardDescription}>{game.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  backRow: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: touchTarget.minHeight + 20,
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
});
