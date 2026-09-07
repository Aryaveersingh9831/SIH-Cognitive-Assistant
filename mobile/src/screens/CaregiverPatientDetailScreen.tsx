// CaregiverPatientDetailScreen.tsx
// Drill-down from CaregiverDashboardScreen. Shows one patient's progress
// summary (from /api/progress/patient/{id}) and recent game history
// (from /api/game-results/patient/{id}).
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, type, touchTarget } from '../theme';
import {
  getPatientProgress,
  getPatientGameResults,
  ProgressResponse,
  GameResult,
} from '../api/auth';

type Props = {
  patientId: string;
  patientName?: string;
  onBack: () => void;
};

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: T };

function trendLabel(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('improv')) return 'Improving';
  if (lower.includes('declin')) return 'Needs attention';
  return 'Steady';
}

function formatDate(timestamp: string): string {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return timestamp;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CaregiverPatientDetailScreen({ patientId, patientName, onBack }: Props) {
  const [progress, setProgress] = useState<LoadState<ProgressResponse>>({ status: 'loading' });
  const [history, setHistory] = useState<LoadState<GameResult[]>>({ status: 'loading' });

  useEffect(() => {
    setProgress({ status: 'loading' });
    getPatientProgress(patientId)
      .then((data) => setProgress({ status: 'ready', data }))
      .catch(() => setProgress({ status: 'error' }));

    setHistory({ status: 'loading' });
    getPatientGameResults(patientId)
      .then((data) => setHistory({ status: 'ready', data }))
      .catch(() => setHistory({ status: 'error' }));
  }, [patientId]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityRole="button">
        <Text style={styles.backText}>{'‹ Back'}</Text>
      </TouchableOpacity>

      <Text style={type.heading}>{patientName || 'Patient Progress'}</Text>

      <Text style={styles.sectionTitle}>Summary</Text>
      {progress.status === 'loading' ? (
        <ActivityIndicator color={colors.primary} style={styles.spacer} />
      ) : progress.status === 'error' ? (
        <Text style={styles.errorText}>Couldn't load progress summary.</Text>
      ) : (
        <View style={styles.summaryGrid}>
          <SummaryCard label="Total Sessions" value={String(progress.data.totalSessions)} />
          <SummaryCard
            label="Avg. Accuracy"
            value={`${Math.round(progress.data.averageAccuracy * 100)}%`}
          />
          <SummaryCard label="Current Difficulty" value={String(progress.data.currentDifficulty)} />
          <SummaryCard
            label="Avg. Difficulty"
            value={progress.data.averageDifficulty.toFixed(1)}
          />
          <SummaryCard label="Trend" value={trendLabel(progress.data.recentPerformanceTrend)} wide />
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Games</Text>
      {history.status === 'loading' ? (
        <ActivityIndicator color={colors.primary} style={styles.spacer} />
      ) : history.status === 'error' ? (
        <Text style={styles.errorText}>Couldn't load game history.</Text>
      ) : history.data.length === 0 ? (
        <Text style={type.bodyMuted}>No games played yet.</Text>
      ) : (
        <View style={styles.historyList}>
          {history.data.map((result, index) => (
            <View key={`${result.createdAt}-${index}`} style={styles.historyCard}>
              <View style={styles.historyTop}>
                <Text style={styles.gameType}>{result.gameType}</Text>
                <Text style={styles.timestamp}>{formatDate(result.createdAt)}</Text>
              </View>
              <View style={styles.historyStatsRow}>
                <HistoryStat label="Score" value={String(result.score)} />
                <HistoryStat label="Accuracy" value={`${Math.round(result.accuracy * 100)}%`} />
                <HistoryStat label="Reaction" value={`${result.reactionTime}ms`} />
                <HistoryStat label="Mistakes" value={String(result.mistakes)} />
                <HistoryStat label="Difficulty" value={String(result.difficulty)} />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function SummaryCard({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.summaryCard, wide && styles.summaryCardWide]}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function HistoryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.historyStat}>
      <Text style={styles.historyStatValue}>{value}</Text>
      <Text style={styles.historyStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  backRow: {
    marginBottom: spacing.md,
    minHeight: touchTarget.minHeight,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  spacer: {
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryCard: {
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryCardWide: {
    flexBasis: '100%',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gameType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
  },
  historyStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  historyStat: {
    minWidth: 60,
  },
  historyStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  historyStatLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
});
