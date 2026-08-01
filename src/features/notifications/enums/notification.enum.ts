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
  // GH-83 — sync Sprint 6.2/6.3 (mobile trước đó dừng ở 18, thiếu 15 type).
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
  // GH-83 — BE đổi 27 → 34 vì 27 đã thuộc ChatEscalatedToAdmin. KHÔNG dùng lại 27.
  TicketMerged: 34,
  System: 99,
} as const;
export type NotificationTypeEnum = (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];

export const NotificationStatusEnum = {
  Pending: 1,
  Sent: 2,
  Failed: 3,
  Read: 4,
  // Sprint 6.3 NOTI3-14 — provider xác nhận đã đẩy tới thiết bị (Expo receipt "ok").
  Delivered: 5,
  // Sprint 6.3 NOTI3-14 — user chủ động mở notification. MẠNH HƠN Read, không phải trạng thái cộng thêm.
  Opened: 6,
} as const;
export type NotificationStatusEnum = (typeof NotificationStatusEnum)[keyof typeof NotificationStatusEnum];

// Nhóm nghiệp vụ của notification (Sprint 6.3 NOTI3-04) — dùng cho ma trận nhóm × kênh.
// Giá trị khớp BE NotificationCategoryEnum.
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

export const DevicePlatformEnum = {
  Ios: 1,
  Android: 2,
  Web: 3,
} as const;
export type DevicePlatformEnum = (typeof DevicePlatformEnum)[keyof typeof DevicePlatformEnum];
