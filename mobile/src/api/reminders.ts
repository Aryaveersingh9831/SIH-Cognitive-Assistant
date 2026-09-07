// mobile/src/api/reminders.ts
import { API_BASE_URL } from './config';
import { getAuthToken } from './authStorage';

export type ReminderType = 'MEDICINE' | 'HYDRATION' | 'ACTIVITY' | 'APPOINTMENT';

export interface Reminder {
    id: number;
    patientId: string;
    type: ReminderType;
    title: string;
    scheduledAt: string; // ISO datetime string
    completed: boolean;
    createdAt: string;
    completedAt: string | null;
}

export interface CreateReminderRequest {
    patientId: string;
    type: ReminderType;
    title: string;
    scheduledAt: string; // ISO datetime string
}

async function authHeaders(): Promise<Record<string, string>> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error('You are not logged in. Please log in again.');
    }
    return { Authorization: `Bearer ${token}` };
}

export async function getPatientReminders(patientId: string): Promise<Reminder[]> {
    const response = await fetch(`${API_BASE_URL}/api/reminders/patient/${patientId}`, {
        headers: await authHeaders(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Could not load reminders.');
    }

    return response.json();
}

export async function createReminder(data: CreateReminderRequest): Promise<Reminder> {
    const response = await fetch(`${API_BASE_URL}/api/reminders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(await authHeaders()),
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Could not create reminder.');
    }

    return response.json();
}

export async function completeReminder(reminderId: number): Promise<Reminder> {
    const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}/complete`, {
        method: 'PATCH',
        headers: await authHeaders(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Could not mark reminder as done.');
    }

    return response.json();
}