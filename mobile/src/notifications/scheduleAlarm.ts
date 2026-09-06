import notifee, { TriggerType, AndroidCategory, AndroidImportance } from '@notifee/react-native';
import { Reminder } from '../api/reminders';

export async function scheduleReminderAlarm(reminder: Reminder, triggerDate: Date): Promise<string | undefined> {
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