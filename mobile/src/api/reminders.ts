export type ReminderType = 'medicine' | 'hydration' | 'activity' | 'appointment';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  time: string;
  done: boolean;
}

export async function fetchReminders(patientId: string): Promise<Reminder[]> {
  return [
    { id: '1', type: 'medicine', title: 'Take blood pressure tablet', time: '8:00 AM', done: false },
    { id: '2', type: 'hydration', title: 'Drink a glass of water', time: '10:00 AM', done: false },
    { id: '3', type: 'medicine', title: 'Take diabetes medicine', time: '1:00 PM', done: false },
    { id: '4', type: 'activity', title: 'Evening walk', time: '5:00 PM', done: false },
    { id: '5', type: 'appointment', title: 'Doctor visit — Dr. Sharma', time: 'Tomorrow, 11:00 AM', done: false },
  ];
}

export async function markReminderDone(reminderId: string): Promise<void> {
  console.log('Marked done (stub):', reminderId);
}