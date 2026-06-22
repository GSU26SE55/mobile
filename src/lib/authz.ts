import { SessionUser, UserRole } from '../types/session.types';

/**
 * GH-47 — Permission constants cho Mobile (subset của 43 code BE).
 * Value = code lowercase `module.action`, khớp `PermissionCodes.cs` + `/api/auth/me/permissions`.
 * Chỉ define các code Mobile (CUSTOMER/STAFF) thực sự dùng — không speculative.
 */
export const P = {
  BATTERY_VIEW: 'battery.view',
  BATTERY_UPDATE: 'battery.update',
  TICKET_VIEW: 'ticket.view',
  TICKET_CREATE: 'ticket.create',
  TICKET_RESOLVE: 'ticket.resolve',
  NOTIFICATION_VIEW: 'notification.view',
  KNOWLEDGE_BASE_VIEW: 'knowledge_base.view',
  USER_VIEW: 'user.view',
} as const;

export type Permission = (typeof P)[keyof typeof P];

/** Feature-gate theo permission — ẩn/hiện button, guard màn. */
export const checkPermission = (user: SessionUser | null, code: Permission): boolean =>
  !!user && user.permissions.includes(code);

/** Coarse-grained gate theo role. */
export const checkRole = (user: SessionUser | null, ...roles: UserRole[]): boolean =>
  !!user && roles.includes(user.role);
