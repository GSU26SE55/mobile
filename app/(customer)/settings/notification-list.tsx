import React from 'react';
import { NotificationList } from '@/src/features/notifications/components/NotificationList';

export default function CustomerNotificationListScreen() {
  // Target route is inferred from entityType + role (notificationHref.ts) — no need to pass href.
  return <NotificationList />;
}
