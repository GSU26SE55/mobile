import { SessionUser, UserRole } from '@/src/types/session.types';

/**
 * GH-47 — Permission constants for Mobile (subset of 53 BE codes, re-verified against DB 2026-08-31).
 * Value = lowercase `module.action` code, matching `PermissionCodes.cs` + `/api/auth/me/permissions`.
 * Only defines the codes Mobile (CUSTOMER/STAFF) actually uses — no speculative entries.
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
  /** Edit/delete another user's message with a reason — only Manager/Admin have this in the JWT, Staff/Customer are always false. */
  CHAT_EDIT_ANY: 'chat.edit.any',
  CHAT_DELETE_ANY: 'chat.delete.any',
} as const;

export type Permission = (typeof P)[keyof typeof P];

/** Feature-gate by permission — show/hide buttons, guard screens. */
export const checkPermission = (user: SessionUser | null, code: Permission): boolean =>
  !!user && user.permissions.includes(code);

/** Coarse-grained gate by role. */
export const checkRole = (user: SessionUser | null, ...roles: UserRole[]): boolean =>
  !!user && roles.includes(user.role);
