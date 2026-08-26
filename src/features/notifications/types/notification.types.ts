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

/**
 * Unread = not Read **and** not Opened (BE doesn't return an `isRead` field).
 *
 * GH-83: must also exclude `Opened` to match BE's definition (`GetUnreadCountQueryHandler`:
 * `Status ∉ {Read, Opened}`). Excluding only `Read` would leave a notification that was just opened
 * (`status = 6`) still showing as "unread" → the server-reported badge shows 0 while the list still has
 * a bolded row, and tapping it again only calls `/read`, which BE leaves `Opened` untouched — so that row
 * would never stop being bolded.
 */
export const isUnread = (n: NotificationDTO): boolean =>
  n.status !== NotificationStatusEnum.Read && n.status !== NotificationStatusEnum.Opened;

export interface NotificationListParams {
  pageNumber?: number;
  pageSize?: number;
  type?: NotificationTypeEnum;
  channel?: NotificationChannelEnum;
  status?: NotificationStatusEnum;
  unreadOnly?: boolean;
}
