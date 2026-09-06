// alerts.ts
// Detects reminders that passed without patient confirmation.
// Call checkMissedReminders() periodically (e.g. every 15-30 min while app is open).

import { getReminders } from './storage';
import { MissedReminderAlert, Reminder } from './types';

const GRACE_PERIOD_MINUTES = 30; // don't flag a reminder as "missed" instantly

function isMissed(reminder: Reminder, now: Date): boolean {
    if (!reminder.active) return false;
    if (reminder.lastConfirmedAt) return false;

    const scheduled = new Date(reminder.timeISO);
    const graceDeadline = new Date(scheduled.getTime() + GRACE_PERIOD_MINUTES * 60_000);
    return now >= graceDeadline;
}

export async function checkMissedReminders(patientId: number): Promise<MissedReminderAlert[]> {
    const reminders = await getReminders(patientId);
    const now = new Date();
    const missed = reminders.filter((r) => isMissed(r, now));

    return missed.map((reminder) => ({
        reminderId: reminder.id,
        patientId: reminder.patientId,
        label: reminder.label,
        scheduledFor: reminder.timeISO,
        detectedAt: now.toISOString(),
    }));
}