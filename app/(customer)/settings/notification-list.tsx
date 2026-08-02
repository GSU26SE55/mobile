import React from 'react';
import { NotificationList } from '@/src/features/notifications/components/NotificationList';

export default function CustomerNotificationListScreen() {
  return (
    <NotificationList
      ticketHref={(id) => ({ pathname: '/(customer)/tickets/[id]', params: { id } })}
    />
  );
}
