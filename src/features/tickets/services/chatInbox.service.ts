import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import { TicketCommentDTO, TicketChatMentionDTO } from '../types/ticket.types';

// GH-68 — chat cross-ticket (Mọi role): inbox tổng, mentions, GDPR erase.
export interface ChatInboxParams {
  page?: number;
  pageSize?: number;
}
export interface MentionListParams {
  page?: number;
  pageSize?: number;
}

/**
 * Số tin chưa đọc của 1 khách hàng.
 * BE đếm theo bản ghi chat nên 1 tin có kèm @mention vẫn là 1 — KHÔNG cộng
 * thêm list mention vào, làm vậy sẽ đếm gấp đôi.
 */
export interface UnreadCountByCustomerDTO {
  customerId: string;
  unreadCount: number;
}

export const chatInboxService = {
  /** Tổng unread chat toàn hệ thống (đã bao gồm cả tin có mention). */
  getMyUnreadCount: () =>
    axiosInstance.get<CommonResponse<number>>(ENDPOINTS.CHATS.UNREAD_COUNT),

  /** Unread gom theo từng khách hàng — 1 call cho cả màn Khách hàng. */
  getUnreadByCustomer: () =>
    axiosInstance.get<CommonResponse<UnreadCountByCustomerDTO[]>>(
      ENDPOINTS.CHATS.UNREAD_BY_CUSTOMER,
    ),

  // BE trả FLAT TicketChatDTO[] (sort DESC), KHÔNG group theo ticket.
  getMyChats: (params?: ChatInboxParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketCommentDTO>>>(
      ENDPOINTS.CHATS.ME,
      { params },
    ),

  getMyMentions: (params?: MentionListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketChatMentionDTO>>>(
      ENDPOINTS.CHATS.MENTIONS_ME,
      { params },
    ),

  // GDPR — overwrite body toàn bộ chat của mình bằng [ERASED].
  // `data` LUÔN null — ChatEraseUserDataCommandHandler không set Data ở nhánh nào.
  // Số lượng đã xoá chỉ nằm trong `message`, KHÔNG có field erasedCount.
  eraseMyData: () =>
    axiosInstance.post<CommonResponse<null>>(ENDPOINTS.CHATS.ERASE_MY_DATA),
};
