import React from 'react';
import { NotificationList } from '@/src/features/notifications/components/NotificationList';

export default function CustomerNotificationListScreen() {
  // Route đích tự suy từ entityType + role (notificationHref.ts) — không cần truyền href.
  return <NotificationList />;
}
