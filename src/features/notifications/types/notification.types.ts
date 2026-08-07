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
 * Unread = chưa Read **và** chưa Opened (BE không trả field `isRead`).
 *
 * GH-83: phải loại cả `Opened` cho khớp định nghĩa của BE (`GetUnreadCountQueryHandler`:
 * `Status ∉ {Read, Opened}`). Chỉ loại `Read` thì notification vừa bấm mở (`status = 6`) vẫn hiện
 * "chưa đọc" → badge lấy từ server báo 0 trong khi danh sách còn dòng tô đậm, và bấm lại chỉ gọi
 * `/read` mà BE giữ nguyên `Opened` nên dòng đó không bao giờ hết đậm.
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
