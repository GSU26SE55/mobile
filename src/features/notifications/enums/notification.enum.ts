// Int-based enums khớp BE — xem docs/api-notification.md §Enums.
// Pattern `as const` object + type alias (KHÔNG dùng TypeScript native enum).

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
  AdminInvite: 13,
  IncidentDeclared: 14,
  CascadeRiskHigh: 15, // Sprint Bonus NS-14 (#658) — cascade risk >= 0.7 → notify Manager/Admin
  BatteryAlertEscalationPending: 16,
  AlertTicketSagaFailed: 17,
  IotDeviceWentOffline: 18,
  System: 99,
} as const;
export type NotificationTypeEnum = (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];

export const NotificationStatusEnum = {
  Pending: 1,
  Sent: 2,
  Failed: 3,
  Read: 4,
} as const;
export type NotificationStatusEnum = (typeof NotificationStatusEnum)[keyof typeof NotificationStatusEnum];

export const NotificationChannelEnum = {
  Push: 1,
  Email: 2,
  Sms: 3,
  InApp: 4,
} as const;
export type NotificationChannelEnum = (typeof NotificationChannelEnum)[keyof typeof NotificationChannelEnum];

export const DevicePlatformEnum = {
  Ios: 1,
  Android: 2,
  Web: 3,
} as const;
export type DevicePlatformEnum = (typeof DevicePlatformEnum)[keyof typeof DevicePlatformEnum];
