export type NotificationTypeEnum =
  | 'TicketAssigned'
  | 'TicketStatusChanged'
  | 'TicketCommented'
  | 'SlaWarning'
  | 'SlaBreach'
  | 'TicketEscalated'
  | 'TicketResolved'
  | 'TicketReopened'
  | 'SystemAlert';

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationTypeEnum;
  title: string;
  body: string;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListParams {
  IsRead?: boolean;
  PageNumber?: number;
  PageSize?: number;
}
