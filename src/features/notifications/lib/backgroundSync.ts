import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { getAccessToken } from '../../../lib/secureStore';
import { presentSystemNotification, syncBadge } from '../../../lib/notifications';
import { NotificationChannelEnum, NotificationStatusEnum } from '../types/notification.types';
import { notificationService } from '../services/notification.service';
import { advanceLastSeen, initLastSeenToNow, readLastSeen } from './lastSeen';

export const NOTIFICATION_SYNC_TASK = 'notification-background-sync';
const MIN_INTERVAL_MINUTES = 15;

/**
 * Replays Push records that were missed while SignalR was disconnected. Push records are used
 * instead of InApp rows so backend push preferences, quiet hours and rate limits remain intact.
 */
export async function syncMissedNotifications(): Promise<number> {
  if (!(await getAccessToken())) return 0;

  const unreadResponse = await notificationService.getUnreadCount();
  const unreadCount = unreadResponse.data.data ?? 0;
  await syncBadge(unreadCount);

  const lastSeen = await readLastSeen();
  if (lastSeen === null) {
    await initLastSeenToNow();
    return unreadCount;
  }

  const response = await notificationService.getList({
    channel: NotificationChannelEnum.Push,
    status: NotificationStatusEnum.Sent,
    pageNumber: 1,
    pageSize: 100,
  });
  const items = response.data.data?.items ?? [];
  const missed = items
    .filter((item) => {
      const createdAt = Date.parse(item.createdAt);
      return !Number.isNaN(createdAt) && createdAt > lastSeen;
    })
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  for (const notification of missed) {
    await presentSystemNotification(notification);
    await advanceLastSeen(notification.createdAt);
  }

  return unreadCount;
}

TaskManager.defineTask(NOTIFICATION_SYNC_TASK, async () => {
  try {
    await syncMissedNotifications();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerNotificationSync(): Promise<void> {
  try {
    if (await TaskManager.isTaskRegisteredAsync(NOTIFICATION_SYNC_TASK)) return;
    await BackgroundTask.registerTaskAsync(NOTIFICATION_SYNC_TASK, {
      minimumInterval: MIN_INTERVAL_MINUTES,
    });
  } catch {
    // Some manufacturers disable scheduled background work; foreground SignalR still works.
  }
}

export async function unregisterNotificationSync(): Promise<void> {
  try {
    if (await TaskManager.isTaskRegisteredAsync(NOTIFICATION_SYNC_TASK)) {
      await BackgroundTask.unregisterTaskAsync(NOTIFICATION_SYNC_TASK);
    }
  } catch {
    // Best effort during logout.
  }
}
