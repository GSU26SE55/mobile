// Int-based enums matching BE — see docs/api-notification.md §Enums.
// Pattern: `as const` object + type alias (do NOT use TypeScript native enum).

export const NotificationTypeEnum = {
  TicketCreated: 1,
  TicketAssigned: 2,
  TicketStatusChanged: 3,
  TicketResolved: 4,
  TicketClosed: 5,
  TicketEscalated: 6,
  SlaWarning: 7,
  SlaBreached: 8,
  BatteryAnomalyDetected: 9,
  EnvironmentalIncidentDetected: 10,
  EnvironmentalIncidentResolved: 11,
  AccountActivated: 12,
  // 13 was AdminInvite and is intentionally retired by the backend.
  IncidentDeclared: 14,
  CascadeRiskHigh: 15, // Sprint Bonus NS-14 (#658) — cascade risk >= 0.7 → notify Manager/Admin
  BatteryAlertEscalationPending: 16,
  AlertTicketSagaFailed: 17,
  IotDeviceWentOffline: 18,
  // GH-83 — sync Sprint 6.2/6.3 (mobile previously stopped at 18, missing 15 types).
  ChatCreated: 19,
  ChatMentioned: 20,
  ChatReacted: 21,
  ParticipantAdded: 22,
  ParticipantRemoved: 23,
  ParticipantRoleChanged: 24,
  BlogGenerationCompleted: 25,
  BlogGenerationFailed: 26,
  ChatEscalatedToAdmin: 27,
  TicketApproved: 28,
  TicketRejected: 29,
  TicketReopened: 30,
  TicketRatingRequested: 31,
  BatteryAnomalyWarning: 32,
  BatteryAnomalyInfo: 33,
  // GH-83 — BE changed 27 → 34 because 27 already belongs to ChatEscalatedToAdmin. Do NOT reuse 27.
  TicketMerged: 34,
  // 35–39 shipped on the BE with active templates but were missing here, so these arrived
  // without a type the app recognised — no label, and no chance of routing a tap.
  SlaAutoResumed: 35,
  IotDeviceRecovered: 36,
  IotDeviceAutoDecommissioned: 37,
  TicketWorkStarted: 38,
  TicketScheduleChanged: 39,
  PeriodicMaintenanceReminder: 40,
  PeriodicMaintenanceScheduleChanged: 41,
  System: 99,
} as const;
export type NotificationTypeEnum = (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];

export const NotificationStatusEnum = {
  Pending: 1,
  Sent: 2,
  Failed: 3,
  Read: 4,
  // Sprint 6.3 NOTI3-14 — provider confirmed delivery to the device (Expo receipt "ok").
  Delivered: 5,
  // Sprint 6.3 NOTI3-14 — user actively opened the notification. STRONGER than Read, not an additive status.
  Opened: 6,
  // GH-792 — CLAIMED for sending, outcome not yet known. Transient status; still counts as unread
  // (isUnread only excludes Read and Opened, so nothing else needs to change).
  Processing: 7,
} as const;
export type NotificationStatusEnum = (typeof NotificationStatusEnum)[keyof typeof NotificationStatusEnum];

// Business category of a notification (Sprint 6.3 NOTI3-04) — used for the category × channel matrix.
// Values match BE NotificationCategoryEnum.
export const NotificationCategoryEnum = {
  Ticket: 1,
  Sla: 2,
  Battery: 3,
  Environmental: 4,
  Chat: 5,
  Account: 6,
} as const;
export type NotificationCategoryEnum = (typeof NotificationCategoryEnum)[keyof typeof NotificationCategoryEnum];

export const NotificationChannelEnum = {
  Push: 1,
  Email: 2,
  Sms: 3,
  InApp: 4,
} as const;
export type NotificationChannelEnum = (typeof NotificationChannelEnum)[keyof typeof NotificationChannelEnum];

// Platform của device token (push notification) — khớp BE DevicePlatformEnum.
export const DevicePlatformEnum = {
  Ios: 1,
  Android: 2,
  Web: 3,
} as const;
export type DevicePlatformEnum = (typeof DevicePlatformEnum)[keyof typeof DevicePlatformEnum];
