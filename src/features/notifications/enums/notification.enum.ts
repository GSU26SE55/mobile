export const NotificationTypeEnum = {
  TicketAssigned: 'TicketAssigned',
  TicketStatusChanged: 'TicketStatusChanged',
  TicketCommented: 'TicketCommented',
  SlaWarning: 'SlaWarning',
  SlaBreach: 'SlaBreach',
  TicketEscalated: 'TicketEscalated',
  TicketResolved: 'TicketResolved',
  TicketReopened: 'TicketReopened',
  SystemAlert: 'SystemAlert',
} as const;
export type NotificationTypeEnum = (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];
