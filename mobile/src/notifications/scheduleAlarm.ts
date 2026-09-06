import notifee, { TriggerType, AndroidCategory, AndroidImportance } from '@notifee/react-native';

// Minimal shape needed to schedule an alarm notification.
// Kept independent of any specific feature's data model (e.g. reminders)
// so this utility can be reused by whichever feature needs alarm scheduling.
export type AlarmContent = {
  title: string;
};

export async function scheduleReminderAlarm(reminder: AlarmContent, triggerDate: Date): Promise<string | undefined> {
  return notifee.createTriggerNotification(
    {
      title: reminder.title,
      body: 'Tap to open',
      android: {
        channelId: 'reminder-alarm',
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        fullScreenAction: { id: 'default' },
        pressAction: { id: 'default' },
        autoCancel: false,
        loopSound: true,
      },
    },
    { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime() }
  );
}