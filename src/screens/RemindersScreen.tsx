import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import notifee from '@notifee/react-native';
import { fetchReminders, markReminderDone, Reminder, ReminderType } from '../api/reminders';
import { scheduleReminderAlarm } from '../notifications/scheduleAlarm';
import { parseReminderTimeToDate } from '../notifications/parseTime';
import { colors, spacing, radius, type } from '../theme';

const TYPE_META: Record<ReminderType, { label: string; color: string; emoji: string }> = {
  medicine: { label: 'Medicine', color: '#D64545', emoji: '💊' },
  hydration: { label: 'Water', color: '#2E86AB', emoji: '💧' },
  activity: { label: 'Activity', color: '#4C9A6A', emoji: '🚶' },
  appointment: { label: 'Appointment', color: '#8E5FD9', emoji: '📅' },
};

const CURRENT_PATIENT_ID = 'demo-patient-1';
const notificationMap: Record<string, string> = {};

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchReminders(CURRENT_PATIENT_ID);
    setReminders(data);
    setLoading(false);

    for (const reminder of data) {
      if (!reminder.done) {
        const triggerDate = parseReminderTimeToDate(reminder.time);
        const notificationId = await scheduleReminderAlarm(reminder, triggerDate);
        if (notificationId) notificationMap[reminder.id] = notificationId;
      }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkDone = async (id: string) => {
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, done: true } : r)));
    await markReminderDone(id);
    const notificationId = notificationMap[id];
    if (notificationId) {
      await notifee.cancelNotification(notificationId);
      delete notificationMap[id];
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const pending = reminders.filter(r => !r.done);
  const completed = reminders.filter(r => r.done);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Today's Reminders</Text>
      {pending.length === 0 && <Text style={styles.emptyText}>All done for today 🎉</Text>}
      {pending.map(reminder => (
        <ReminderCard key={reminder.id} reminder={reminder} onMarkDone={handleMarkDone} />
      ))}
      {completed.length > 0 && (
        <>
          <Text style={styles.subHeader}>Completed</Text>
          {completed.map(reminder => (
            <ReminderCard key={reminder.id} reminder={reminder} onMarkDone={handleMarkDone} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function ReminderCard({ reminder, onMarkDone }: { reminder: Reminder; onMarkDone: (id: string) => void }) {
  const meta = TYPE_META[reminder.type];
  return (
    <View style={[styles.card, { borderLeftColor: meta.color }, reminder.done && styles.cardDone]}>
      <View style={styles.cardLeft}><Text style={styles.emoji}>{meta.emoji}</Text></View>
      <View style={styles.cardBody}>
        <Text style={styles.typeLabel}>{meta.label}</Text>
        <Text style={[styles.title, reminder.done && styles.titleDone]}>{reminder.title}</Text>
        <Text style={styles.time}>{reminder.time}</Text>
      </View>
      {!reminder.done && (
        <TouchableOpacity style={[styles.doneButton, { backgroundColor: meta.color }]} onPress={() => onMarkDone(reminder.id)}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      )}
      {reminder.done && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    ...type.heading,
    marginBottom: spacing.md,
  },
  subHeader: {
    ...type.subheading,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...type.bodyMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 6,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardDone: { opacity: 0.55 },
  cardLeft: { marginRight: spacing.md },
  emoji: { fontSize: 32 },
  cardBody: { flex: 1 },
  typeLabel: {
    ...type.label,
    color: colors.textMuted,
    marginBottom: 2,
  },
  title: {
    ...type.body,
    fontWeight: '600' as const,
  },
  titleDone: { textDecorationLine: 'line-through' },
  time: {
    ...type.bodyMuted,
    marginTop: 2,
  },
  doneButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  doneButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  checkmark: { fontSize: 24, color: colors.primary, fontWeight: '700', marginLeft: spacing.sm },
});