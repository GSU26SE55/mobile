import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
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
export interface EraseMyChatDataDTO {
  erasedCount: number;
}

export const chatInboxService = {
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
  eraseMyData: () =>
    axiosInstance.post<CommonResponse<EraseMyChatDataDTO>>(ENDPOINTS.CHATS.ERASE_MY_DATA),
};
