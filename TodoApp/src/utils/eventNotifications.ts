import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Event } from '../types';
import { getEvents } from '../storage';

// iOS limits the number of pending local notifications per app to 64.
const MAX_PENDING_REMINDERS = 60;
let reminderOperationQueue: Promise<void> = Promise.resolve();

interface ReminderCandidate {
  event: Event;
  reminderId: string;
  minutesBefore: number;
  triggerDate: Date;
}

function getOccurrenceDate(event: Event, index: number): Date {
  const start = new Date(event.startDate);
  const recurrence = event.recurrence;
  if (!recurrence || index === 0) return start;

  const occurrence = new Date(start);
  const interval = recurrence.interval * index;

  if (recurrence.frequency === 'daily') {
    occurrence.setDate(start.getDate() + interval);
  } else if (recurrence.frequency === 'weekly') {
    occurrence.setDate(start.getDate() + interval * 7);
  } else if (recurrence.frequency === 'monthly') {
    const monthIndex = start.getFullYear() * 12 + start.getMonth() + interval;
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const day = Math.min(start.getDate(), new Date(year, month + 1, 0).getDate());
    occurrence.setFullYear(year, month, day);
  } else {
    const year = start.getFullYear() + interval;
    const day = Math.min(start.getDate(), new Date(year, start.getMonth() + 1, 0).getDate());
    occurrence.setFullYear(year, start.getMonth(), day);
  }

  return occurrence;
}

function getFirstRelevantOccurrence(event: Event, now: Date): number {
  const recurrence = event.recurrence;
  if (!recurrence) return 0;

  const start = new Date(event.startDate);
  let periodsApart: number;
  if (recurrence.frequency === 'daily') {
    periodsApart = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  } else if (recurrence.frequency === 'weekly') {
    periodsApart = Math.floor((now.getTime() - start.getTime()) / (7 * 86_400_000));
  } else if (recurrence.frequency === 'monthly') {
    periodsApart =
      (now.getFullYear() - start.getFullYear()) * 12 +
      now.getMonth() - start.getMonth();
  } else {
    periodsApart = now.getFullYear() - start.getFullYear();
  }

  return Math.max(0, Math.floor(periodsApart / recurrence.interval) - 1);
}

function getReminderCandidates(events: Event[], now: Date): ReminderCandidate[] {
  const candidates: ReminderCandidate[] = [];

  for (const event of events) {
    if (event.reminders.length === 0) continue;

    let occurrenceIndex = getFirstRelevantOccurrence(event, now);
    let futureOccurrences = 0;
    while (futureOccurrences < MAX_PENDING_REMINDERS) {
      if (
        event.recurrence?.endAfterOccurrences !== undefined &&
        occurrenceIndex >= event.recurrence.endAfterOccurrences
      ) {
        break;
      }

      const occurrence = getOccurrenceDate(event, occurrenceIndex);
      if (
        event.recurrence?.endDate &&
        occurrence > new Date(event.recurrence.endDate)
      ) {
        break;
      }
      if (!event.recurrence && occurrenceIndex > 0) break;

      if (occurrence > now) futureOccurrences++;

      for (const reminder of event.reminders) {
        const triggerDate = new Date(
          occurrence.getTime() - reminder.minutesBefore * 60_000
        );
        if (triggerDate > now) {
          candidates.push({
            event,
            reminderId: reminder.id,
            minutesBefore: reminder.minutesBefore,
            triggerDate,
          });
        }
      }

      occurrenceIndex++;
    }
  }

  return candidates
    .sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime())
    .slice(0, MAX_PENDING_REMINDERS);
}

function formatReminderOffset(minutes: number): string {
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} Tag${days === 1 ? '' : 'en'}`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} Stunde${hours === 1 ? '' : 'n'}`;
  }
  return `${minutes} Minute${minutes === 1 ? '' : 'n'}`;
}

async function requestNotificationPermission(): Promise<boolean> {
  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted && permissions.canAskAgain) {
    permissions = await Notifications.requestPermissionsAsync();
  }
  return permissions.granted;
}

function isEventReminder(notification: Notifications.NotificationRequest): boolean {
  return notification.content.data?.type === 'event-reminder';
}

function serializeReminderOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = reminderOperationQueue.then(operation);
  reminderOperationQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function syncEventRemindersInternal(
  requestPermission = false
): Promise<void> {
  if (Platform.OS === 'web') {
    if (requestPermission) {
      const candidates = getReminderCandidates(await getEvents(), new Date());
      if (candidates.length > 0) {
        throw new Error('Lokale Terminerinnerungen sind in der Webversion nicht verfügbar.');
      }
    }
    return;
  }

  const events = await getEvents();
  const candidates = getReminderCandidates(events, new Date());
  let canSchedule = candidates.length === 0;
  if (candidates.length > 0) {
    canSchedule = requestPermission
      ? await requestNotificationPermission()
      : (await Notifications.getPermissionsAsync()).granted;

    if (!canSchedule && requestPermission) {
      throw new Error(
        'Benachrichtigungen sind nicht erlaubt. Aktiviere sie in den Geräteeinstellungen, um Terminerinnerungen zu erhalten.'
      );
    }
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existingReminderIds = scheduled
    .filter(isEventReminder)
    .map(notification => notification.identifier);
  await Promise.all(
    existingReminderIds.map(id => Notifications.cancelScheduledNotificationAsync(id))
  );

  const newlyScheduledIds: string[] = [];
  try {
    for (const candidate of canSchedule ? candidates : []) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Erinnerung: ${candidate.event.title}`,
          body: `Der Termin beginnt in ${formatReminderOffset(candidate.minutesBefore)}.`,
          sound: 'default',
          data: {
            type: 'event-reminder',
            eventId: candidate.event.id,
            reminderId: candidate.reminderId,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: candidate.triggerDate,
        },
      });
      newlyScheduledIds.push(id);
    }
  } catch (error) {
    await Promise.all(
      newlyScheduledIds.map(id => Notifications.cancelScheduledNotificationAsync(id))
    );
    throw error;
  }
}

export function syncEventReminders(requestPermission = false): Promise<void> {
  return serializeReminderOperation(() =>
    syncEventRemindersInternal(requestPermission)
  );
}

async function cancelEventRemindersInternal(eventId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const eventReminderIds = scheduled
    .filter(
      notification =>
        isEventReminder(notification) &&
        notification.content.data?.eventId === eventId
    )
    .map(notification => notification.identifier);
  await Promise.all(
    eventReminderIds.map(id => Notifications.cancelScheduledNotificationAsync(id))
  );
}

export function cancelEventReminders(eventId: string): Promise<void> {
  return serializeReminderOperation(() => cancelEventRemindersInternal(eventId));
}
