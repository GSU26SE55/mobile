import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import {
  KbArticleDto,
  KbArticleListItemDto,
  KbArticleSuggestDto,
  KbListParams,
} from '../types/knowledge-base.types';

const { KNOWLEDGE_BASE } = ENDPOINTS;

export const knowledgeBaseService = {
  getList: (params?: KbListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<KbArticleListItemDto>>>(KNOWLEDGE_BASE.LIST, { params }),

  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<KbArticleDto>>(KNOWLEDGE_BASE.DETAIL(id)),

  // suggest nhận TicketId (Guid) — gợi ý bài cùng category với ticket đã tồn tại.
  suggest: (ticketId: string) =>
    axiosInstance.get<CommonResponse<KbArticleSuggestDto[]>>(KNOWLEDGE_BASE.SUGGEST, {
      params: { TicketId: ticketId },
    }),

  markHelpful: (id: string) =>
    axiosInstance.post<CommonResponse<object>>(KNOWLEDGE_BASE.HELPFUL(id)),
};
