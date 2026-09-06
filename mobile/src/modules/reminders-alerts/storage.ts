// storage.ts
// Offline-first local storage for reminders. Works with zero network.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder } from './types';

const REMINDERS_KEY = 'reminders:v1';

async function readAll(): Promise<Reminder[]> {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    return raw ? JSON.parse(raw) : [];
}

async function writeAll(reminders: Reminder[]): Promise<void> {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export async function getReminders(patientId: number): Promise<Reminder[]> {
    const all = await readAll();
    return all.filter((r) => r.patientId === patientId);
}

export async function saveReminder(reminder: Reminder): Promise<void> {
    const all = await readAll();
    const idx = all.findIndex((r) => r.id === reminder.id);
    if (idx >= 0) {
        all[idx] = reminder;
    } else {
        all.push(reminder);
    }
    await writeAll(all);
}

export async function deleteReminder(id: string): Promise<void> {
    const all = await readAll();
    await writeAll(all.filter((r) => r.id !== id));
}

export async function confirmReminder(id: string, confirmedAtISO: string): Promise<Reminder | null> {
    const all = await readAll();
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], lastConfirmedAt: confirmedAtISO };
    await writeAll(all);
    return all[idx];
}  