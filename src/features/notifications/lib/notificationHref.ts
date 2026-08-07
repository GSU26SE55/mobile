import { router } from 'expo-router';
import { UserRole } from '../../../types/session.types';

export type NotificationHref = Parameters<typeof router.push>[0];
type MobileRole = Extract<UserRole, 'CUSTOMER' | 'STAFF'>;

const isMobileRole = (role: UserRole): role is MobileRole =>
  role === 'CUSTOMER' || role === 'STAFF';

type RouteBuilder = (id: string) => NotificationHref;
const ROUTES: Record<string, Record<MobileRole, RouteBuilder | null>> = {
  Ticket: {
    CUSTOMER: (id) => `/(customer)/tickets/${id}` as NotificationHref,
    STAFF: (id) => `/(staff)/tickets/${id}` as NotificationHref,
  },
  Battery: {
    CUSTOMER: (id) => `/(customer)/batteries/${id}` as NotificationHref,
    STAFF: (id) => `/(staff)/batteries/${id}` as NotificationHref,
  },
  BatteryAsset: {
    CUSTOMER: (id) => `/(customer)/batteries/${id}` as NotificationHref,
    STAFF: (id) => `/(staff)/batteries/${id}` as NotificationHref,
  },
  Alert: {
    CUSTOMER: (id) => `/(customer)/alerts/${id}` as NotificationHref,
    STAFF: (id) => `/(staff)/alerts/${id}` as NotificationHref,
  },
  EnvironmentalIncident: {
    CUSTOMER: (id) => `/(customer)/incidents/${id}` as NotificationHref,
    STAFF: (id) => `/(staff)/incidents/${id}` as NotificationHref,
  },
  BlogPost: {
    CUSTOMER: (id) => `/(customer)/blog/${id}` as NotificationHref,
    STAFF: (id) => `/(staff)/blog/${id}` as NotificationHref,
  },
  IotDevice: {
    CUSTOMER: null,
    STAFF: () => '/(staff)/alerts' as NotificationHref,
  },
  Account: { CUSTOMER: null, STAFF: null },
  AlertTicketSaga: { CUSTOMER: null, STAFF: null },
};

export function ticketIdFromPayload(payloadJson: string | null | undefined): string | null {
  if (!payloadJson) return null;
  try {
    const value = JSON.parse(payloadJson) as { ticketId?: unknown };
    return typeof value.ticketId === 'string' ? value.ticketId : null;
  } catch {
    return null;
  }
}

/** Maps both in-app feed rows and push payloads to the same destination. */
export function notificationHref(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  role: UserRole | undefined,
  ticketId?: string | null,
): NotificationHref | null {
  if (!entityType || !role || !isMobileRole(role)) return null;

  if (entityType === 'Chat') {
    if (!ticketId) {
      return (role === 'CUSTOMER' ? '/(customer)/chats' : '/(staff)/chats') as NotificationHref;
    }

    return {
      pathname:
        role === 'CUSTOMER'
          ? '/(customer)/tickets/[id]'
          : '/(staff)/tickets/[id]',
      params: { id: ticketId, tab: 'chat' },
    } as NotificationHref;
  }

  const build = ROUTES[entityType]?.[role];
  if (!build || !entityId) return null;
  return build(entityId);
}
