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
  // 13 was AdminInvite and is intentionally retired by the backend.
  IncidentDeclared: 14,
  CascadeRiskHigh: 15, // Sprint Bonus NS-14 (#658) — cascade risk >= 0.7 → notify Manager/Admin
  BatteryAlertEscalationPending: 16,
  AlertTicketSagaFailed: 17,
  IotDeviceWentOffline: 18,
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
  TicketMerged: 34,
  System: 99,
} as const;
export type NotificationTypeEnum = (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];

export const NotificationStatusEnum = {
  Pending: 1,
  Sent: 2,
  Failed: 3,
  Read: 4,
  /** Relay BE đang gửi — trạng thái tạm, client chỉ gặp khi list ngay lúc đang dispatch. */
  Delivered: 5,
  Opened: 6,
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
