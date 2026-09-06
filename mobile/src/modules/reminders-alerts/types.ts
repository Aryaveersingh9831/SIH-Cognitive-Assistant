// types.ts
// Shared types for offline reminder completion + missed-reminder alerts.

export type ReminderType = 'MEDICINE' | 'HYDRATION' | 'ACTIVITY' | 'APPOINTMENT';
export type RepeatRule = 'NONE' | 'DAILY' | 'WEEKLY';

export interface Reminder {
    id: string;
    patientId: number;
    type: ReminderType;
    label: string;
    timeISO: string;
    repeat: RepeatRule;
    active: boolean;
    createdAt: string;
    lastConfirmedAt?: string;
}

export type SyncOp =
    | { op: 'CREATE'; reminder: Reminder }
    | { op: 'UPDATE'; reminder: Reminder }
    | { op: 'DELETE'; id: string }
    | { op: 'CONFIRM'; id: string; confirmedAt: string };

export interface MissedReminderAlert {
    reminderId: string;
    patientId: number;
    label: string;
    scheduledFor: string;
    detectedAt: string;
}