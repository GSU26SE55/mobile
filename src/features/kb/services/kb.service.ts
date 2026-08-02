import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import { KbCategoryCode } from '@/src/shared/enums/kb.enum';
import type {
  KbArticleSummaryDTO,
  KbArticleSuggestDTO,
  KbArticleDTO,
  KbListParams,
  KbListQuery,
  TicketKbReferenceDTO,
  AddKbReferencePayload,
} from '../types/kb.types';

function toListQuery(params?: KbListParams): KbListQuery | undefined {
  if (!params) return undefined;
  const query: KbListQuery = {};
  if (params.pageNumber !== undefined) query.PageNumber = params.pageNumber;
  if (params.pageSize !== undefined) query.PageSize = params.pageSize;
  const trimmed = params.q?.trim();
  if (trimmed) query.Q = trimmed;
  if (params.category) query.Category = KbCategoryCode[params.category];
  if (params.tag) query.Tag = params.tag;
  return Object.keys(query).length > 0 ? query : undefined;
}

export const kbService = {
  getList: (params?: KbListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<KbArticleSummaryDTO>>>(
      ENDPOINTS.KNOWLEDGE_BASE.LIST,
      { params: toListQuery(params) },
    ),
  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<KbArticleDTO>>(
      ENDPOINTS.KNOWLEDGE_BASE.DETAIL(id),
    ),
  markHelpful: (id: string) =>
    axiosInstance.post<CommonResponse<object>>(
      ENDPOINTS.KNOWLEDGE_BASE.HELPFUL(id),
    ),
  getTicketRefs: (ticketId: string) =>
    axiosInstance.get<CommonResponse<TicketKbReferenceDTO[]>>(
      ENDPOINTS.KB_REFERENCES.LIST,
      { params: { ticketId } },
    ),
  // GH-44 #7 — gợi ý KB theo ticket (param BE là `TicketId`, Guid).
  suggest: (ticketId: string) =>
    axiosInstance.get<CommonResponse<KbArticleSuggestDTO[]>>(
      ENDPOINTS.KNOWLEDGE_BASE.SUGGEST,
      { params: { TicketId: ticketId } },
    ),
  // GH-44 #5 — gán bài KB vào ticket.
  addReference: (data: AddKbReferencePayload) =>
    axiosInstance.post<CommonResponse<object>>(ENDPOINTS.KB_REFERENCES.LIST, data),
  // GH-44 #6 — gỡ tham chiếu KB (soft delete).
  removeReference: (referenceId: string) =>
    axiosInstance.delete<CommonResponse<object>>(ENDPOINTS.KB_REFERENCES.ITEM(referenceId)),
};
