// CaregiverDashboardScreen.tsx
// Landing screen for caregiver/health-worker accounts. Shows a scannable
// summary per patient — not raw data dumps. Full trend charts are a later
// screen (CaregiverPatientDetail); this is the "what needs my attention" view.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius, type, touchTarget } from '../theme';

export type PatientSummary = {
  id: string;
  name: string;
  lastActive: string; // human-readable, e.g. "Today", "2 days ago"
  weeklySessions: number;
  reminderAdherence: number; // 0-1
  trend: 'up' | 'flat' | 'down';
  alert?: string; // present only if something needs attention
};

type Props = {
  caregiverName?: string;
  patients?: PatientSummary[];
  onSelectPatient: (patientId: string) => void;
};

// TODO: replace with GET /api/caregiver/patients once backend teammate
// exposes it. Mock data keeps this screen demoable independently.
const MOCK_PATIENTS: PatientSummary[] = [
  {
    id: 'p1',
    name: 'Ramesh Sharma',
    lastActive: 'Today',
    weeklySessions: 5,
    reminderAdherence: 0.9,
    trend: 'up',
  },
  {
    id: 'p2',
    name: 'Kamala Devi',
    lastActive: '2 days ago',
    weeklySessions: 1,
    reminderAdherence: 0.4,
    trend: 'down',
    alert: 'Missed 3 medicine reminders this week',
  },
  {
    id: 'p3',
    name: 'Bipin Rai',
    lastActive: 'Yesterday',
    weeklySessions: 3,
    reminderAdherence: 0.75,
    trend: 'flat',
  },
];

const TREND_LABEL: Record<PatientSummary['trend'], string> = {
  up: 'Improving',
  flat: 'Steady',
  down: 'Needs attention',
};

export default function CaregiverDashboardScreen({
  caregiverName,
  patients = MOCK_PATIENTS,
  onSelectPatient,
}: Props) {
  const alertCount = patients.filter((p) => p.alert).length;

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

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {patients.map((patient) => (
          <TouchableOpacity
            key={patient.id}
            style={[styles.card, patient.alert && styles.cardAlert]}
            onPress={() => onSelectPatient(patient.id)}
            accessibilityRole="button"
          >
            <View style={styles.cardTop}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.lastActive}>{patient.lastActive}</Text>
            </View>

            <View style={styles.statsRow}>
              <Stat label="Sessions" value={String(patient.weeklySessions)} />
              <Stat
                label="Reminders"
                value={`${Math.round(patient.reminderAdherence * 100)}%`}
              />
              <Stat label="Trend" value={TREND_LABEL[patient.trend]} />
            </View>

            {patient.alert ? (
              <Text style={styles.alertText}>{patient.alert}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
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
