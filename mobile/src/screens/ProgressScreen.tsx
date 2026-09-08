// ProgressScreen.tsx
// Patient-facing view of GET /api/progress/patient/{patientId} — the "My
// Progress" tile on HomeScreen. Shows the same summary metrics
// CaregiverPatientDetailScreen already shows caregivers, styled to match.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, type, touchTarget } from '../theme';
import { getPatientProgress, ProgressResponse } from '../api/auth';

type Props = {
  patientId?: string;
  onBack: () => void;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: ProgressResponse };

function trendLabel(raw: string): string {
  switch (raw) {
    case 'improving':
      return 'Improving';
    case 'declining':
      return 'Needs attention';
    case 'insufficient_data':
      return 'Not enough data';
    case 'stable':
    default:
      return 'Steady';
  }
}

export default function ProgressScreen({ patientId, onBack }: Props) {
  const [progress, setProgress] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!patientId) {
      return;
    }
    setProgress({ status: 'loading' });
    getPatientProgress(patientId)
      .then((data) => setProgress({ status: 'ready', data }))
      .catch(() => setProgress({ status: 'error' }));
  }, [patientId]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityRole="button">
        <Text style={styles.backText}>{'‹ Back'}</Text>
      </TouchableOpacity>

      <Text style={type.heading}>My Progress</Text>
      <Text style={[type.bodyMuted, styles.subtitle]}>See how you have been doing.</Text>

      {!patientId ? (
        <Text style={styles.errorText}>
          We couldn't identify your account. Please log out and log in again.
        </Text>
      ) : progress.status === 'loading' ? (
        <ActivityIndicator color={colors.primary} style={styles.spacer} />
      ) : progress.status === 'error' ? (
        <Text style={styles.errorText}>Couldn't load your progress. Please try again later.</Text>
      ) : progress.data.totalSessions === 0 ? (
        <Text style={[type.bodyMuted, styles.spacer]}>
          No games played yet — play a game to start seeing your progress here.
        </Text>
      ) : (
        <View style={styles.summaryGrid}>
          <SummaryCard label="Total Sessions" value={String(progress.data.totalSessions)} />
          <SummaryCard
            label="Avg. Accuracy"
            value={`${Math.round(progress.data.averageAccuracy * 100)}%`}
          />
          <SummaryCard label="Current Difficulty" value={String(progress.data.currentDifficulty)} />
          <SummaryCard label="Avg. Difficulty" value={progress.data.averageDifficulty.toFixed(1)} />
          <SummaryCard label="Trend" value={trendLabel(progress.data.recentPerformanceTrend)} wide />
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
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  spacer: {
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: spacing.md,
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
});
