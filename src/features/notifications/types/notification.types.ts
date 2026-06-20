import {
  NotificationChannelEnum,
  NotificationStatusEnum,
  NotificationTypeEnum,
} from '../enums/notification.enum';

export {
  NotificationChannelEnum,
  NotificationStatusEnum,
  NotificationTypeEnum,
} from '../enums/notification.enum';

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationTypeEnum;
  channel: NotificationChannelEnum;
  status: NotificationStatusEnum;
  title: string;
  body: string;
  payloadJson: string | null;
  entityType: string | null;
  entityId: string | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Unread = chưa ở trạng thái Read (BE không trả field `isRead`). */
export const isUnread = (n: NotificationDTO): boolean => n.status !== NotificationStatusEnum.Read;

export interface NotificationListParams {
  pageNumber?: number;
  pageSize?: number;
  type?: NotificationTypeEnum;
  channel?: NotificationChannelEnum;
  status?: NotificationStatusEnum;
  unreadOnly?: boolean;
}
