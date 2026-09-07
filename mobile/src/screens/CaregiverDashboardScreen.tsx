// CaregiverDashboardScreen.tsx
// Landing screen for caregiver/health-worker accounts. Shows a scannable
// summary per patient — not raw data dumps. Full trend charts are a later
// screen (CaregiverPatientDetail); this is the "what needs my attention" view.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { colors, spacing, radius, type, touchTarget } from '../theme';
import { getPatientProgress, ProgressResponse, getCaregiverPatients, CaregiverPatient } from '../api/auth';

type Props = {
  caregiverName?: string;
  onSelectPatient: (patientId: string, patientName: string) => void;
};

function formatLastActive(raw: string | null): string {
  if (!raw) return 'No activity yet';
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

type Trend = 'up' | 'flat' | 'down';

const TREND_LABEL: Record<Trend, string> = {
  up: 'Improving',
  flat: 'Steady',
  down: 'Needs attention',
};

function normalizeTrend(raw: string): Trend {
  const lower = raw.toLowerCase();
  if (lower.includes('improv')) return 'up';
  if (lower.includes('declin')) return 'down';
  return 'flat';
}

type StatsState = Record<
  string,
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: ProgressResponse }
>;

type PatientListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: CaregiverPatient[] };

export default function CaregiverDashboardScreen({
  caregiverName,
  onSelectPatient,
}: Props) {
  const [patientList, setPatientList] = useState<PatientListState>({ status: 'loading' });
  const [stats, setStats] = useState<StatsState>({});
  const [refreshing, setRefreshing] = useState(false);

  const patients = patientList.status === 'ready' ? patientList.data : [];

  const fetchAllStats = async (list: CaregiverPatient[]) => {
    await Promise.all(
      list.map((patient) => {
        const key = patient.patientId;
        setStats((prev) => ({ ...prev, [key]: { status: 'loading' } }));
        return getPatientProgress(patient.patientId)
          .then((data) => {
            setStats((prev) => ({ ...prev, [key]: { status: 'ready', data } }));
          })
          .catch(() => {
            setStats((prev) => ({ ...prev, [key]: { status: 'error' } }));
          });
      })
    );
  };

  const fetchEverything = async () => {
    setPatientList({ status: 'loading' });
    try {
      const list = await getCaregiverPatients();
      setPatientList({ status: 'ready', data: list });
      await fetchAllStats(list);
    } catch {
      setPatientList({ status: 'error' });
    }
  };

  useEffect(() => {
    fetchEverything();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEverything();
    setRefreshing(false);
  };

  const alertCount = patients.filter((p) => {
    const s = stats[p.patientId];
    return s?.status === 'ready' && normalizeTrend(s.data.recentPerformanceTrend) === 'down';
  }).length;

  return (
    <View style={styles.container}>
      <Text style={type.heading}>
        {caregiverName ? `Hello, ${caregiverName}` : 'Your Patients'}
      </Text>
      <Text style={[type.bodyMuted, styles.subtitle]}>
        {alertCount > 0
          ? `${alertCount} patient${alertCount > 1 ? 's' : ''} need${alertCount === 1 ? 's' : ''} your attention.`
          : 'Everyone is on track this week.'}
      </Text>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {patientList.status === 'loading' ? (
          <ActivityIndicator color={colors.primary} />
        ) : patientList.status === 'error' ? (
          <Text style={styles.alertText}>Couldn't load your patient list.</Text>
        ) : patients.length === 0 ? (
          <Text style={type.bodyMuted}>No patients linked to your account yet.</Text>
        ) : null}

        {patients.map((patient) => {
          const s = stats[patient.patientId];
          const isAlert = s?.status === 'ready' && normalizeTrend(s.data.recentPerformanceTrend) === 'down';

          return (
            <TouchableOpacity
              key={patient.patientId}
              style={[styles.card, isAlert && styles.cardAlert]}
              onPress={() => onSelectPatient(patient.patientId, patient.name)}
              accessibilityRole="button"
            >
              <View style={styles.cardRow}>
                <View style={styles.cardMain}>
                  <View style={styles.cardTop}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.lastActive}>{formatLastActive(patient.lastActive)}</Text>
                  </View>

                  {!s || s.status === 'loading' ? (
                    <ActivityIndicator style={styles.statsRow} color={colors.primary} />
                  ) : s.status === 'error' ? (
                    <Text style={styles.alertText}>Couldn't load progress data.</Text>
                  ) : (
                    <>
                      <View style={styles.statsRow}>
                        <Stat label="Sessions" value={String(s.data.totalSessions)} />
                        <Stat label="Accuracy" value={`${Math.round(s.data.averageAccuracy * 100)}%`} />
                        <Stat label="Trend" value={TREND_LABEL[normalizeTrend(s.data.recentPerformanceTrend)]} />
                      </View>
                      {isAlert ? (
                        <Text style={styles.alertText}>Recent performance is declining.</Text>
                      ) : null}
                    </>
                  )}
                </View>
                <Text style={styles.chevron}>{'\u203a'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: touchTarget.minHeight + 40,
  },
  cardAlert: {
    borderColor: colors.error,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMain: {
    flex: 1,
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  lastActive: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  alertText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
});
