export { NotificationTypeEnum } from '../enums/notification.enum';

import type { NotificationTypeEnum } from '../enums/notification.enum';

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
