import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import { TicketCommentDTO, TicketChatMentionDTO } from '../types/ticket.types';

// GH-68 — cross-ticket chat (All roles): combined inbox, mentions, GDPR erase.
export interface ChatInboxParams {
  page?: number;
  pageSize?: number;
}
export interface MentionListParams {
  page?: number;
  pageSize?: number;
}

/**
 * Unread message count for one customer.
 * BE counts by chat record, so a message with an @mention still counts as 1 — do NOT
 * add the mention list on top, that would double-count.
 */
export interface UnreadCountByCustomerDTO {
  customerId: string;
  unreadCount: number;
}

export const chatInboxService = {
  /** Total unread chat count system-wide (includes messages with mentions). */
  getMyUnreadCount: () =>
    axiosInstance.get<CommonResponse<number>>(ENDPOINTS.CHATS.UNREAD_COUNT),

  /** Unread counts grouped by customer — 1 call for the whole Customers screen. */
  getUnreadByCustomer: () =>
    axiosInstance.get<CommonResponse<UnreadCountByCustomerDTO[]>>(
      ENDPOINTS.CHATS.UNREAD_BY_CUSTOMER,
    ),

  // BE returns a FLAT TicketChatDTO[] (sorted DESC), NOT grouped by ticket.
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

  // GDPR — overwrite the body of all of this user's chats with [ERASED].
  // `data` is ALWAYS null — ChatEraseUserDataCommandHandler doesn't set Data on any branch.
  // The erased count only appears in `message`, there is NO erasedCount field.
  eraseMyData: () =>
    axiosInstance.post<CommonResponse<null>>(ENDPOINTS.CHATS.ERASE_MY_DATA),
};
