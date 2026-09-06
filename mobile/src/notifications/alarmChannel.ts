import notifee, { AndroidImportance } from '@notifee/react-native';

export async function setupAlarmChannel() {
  await notifee.requestPermission();

  await notifee.createChannel({
    id: 'reminder-alarm',
    name: 'Reminder Alarms',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    bypassDnd: true,
    // no "sound" line — uses the phone's default notification sound
  });
}