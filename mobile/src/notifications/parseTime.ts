export function parseReminderTimeToDate(timeStr: string): Date {
  const now = new Date();
  const isTomorrow = timeStr.toLowerCase().includes('tomorrow');
  const cleanTime = timeStr.replace(/tomorrow,?\s*/i, '').trim();

  const match = cleanTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return now;

  let [, hourStr, minuteStr, meridiem] = match;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (meridiem.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;

  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);

  if (isTomorrow) result.setDate(result.getDate() + 1);
  if (!isTomorrow && result.getTime() < now.getTime()) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}