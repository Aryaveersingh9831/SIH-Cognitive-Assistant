// RemindersScreen.tsx
// Shows a patient's reminders (medicine/hydration/activity/appointment).
// Patients can mark reminders done. Uses the real backend Reminder API —
// no mock/fake data.
//
// Note: caregiver reminder creation is intentionally not implemented here.
// The backend's ReminderService currently only authorizes the PATIENT who
// owns a patientId (see ReminderService.isOwner) — there is no
// caregiver-patient relationship model yet, so a caregiver-facing "create"
// UI would always receive 403. Add it back once backend authorization
// supports caregivers (tracked separately).
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, type, touchTarget } from '../theme';
import { Reminder, ReminderType, getPatientReminders, completeReminder } from '../api/reminders';

type Props = {
  patientId: string;
  onBack: () => void;
};

const REMINDER_TYPE_LABEL: Record<ReminderType, string> = {
  MEDICINE: 'Medicine',
  HYDRATION: 'Hydration',
  ACTIVITY: 'Activity',
  APPOINTMENT: 'Appointment',
};

export default function RemindersScreen({ patientId, onBack }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingId, setCompletingId] = useState<number | null>(null);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPatientReminders(patientId);
      setReminders(data);
    } catch (e: any) {
      setError(e.message || 'Could not load reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleMarkDone = async (reminder: Reminder) => {
    setCompletingId(reminder.id);
    try {
      const updated = await completeReminder(reminder.id);
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e: any) {
      setError(e.message || 'Could not mark reminder as done.');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button">
          <Text style={styles.backLink}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={type.heading}>My Reminders</Text>
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[type.bodyMuted, styles.loadingText]}>Loading reminders...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadReminders}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : reminders.length === 0 ? (
        <View style={styles.centerFill}>
          <Text style={type.bodyMuted}>You have no reminders right now.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {reminders.map((reminder) => (
            <View
              key={reminder.id}
              style={[styles.card, reminder.completed && styles.cardCompleted]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardType}>{REMINDER_TYPE_LABEL[reminder.type]}</Text>
                <Text style={styles.cardTitle}>{reminder.title}</Text>
                <Text style={styles.cardTime}>
                  {new Date(reminder.scheduledAt).toLocaleString()}
                </Text>
              </View>

              {reminder.completed ? (
                <Text style={styles.doneLabel}>Done</Text>
              ) : (
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => handleMarkDone(reminder)}
                  disabled={completingId === reminder.id}
                  accessibilityRole="button"
                >
                  {completingId === reminder.id ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Text style={styles.doneButtonText}>Done</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
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
  header: {
    marginBottom: spacing.lg,
  },
  backLink: {
    color: colors.primary,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: touchTarget.minHeight + 24,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  cardType: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cardTime: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  doneLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
});