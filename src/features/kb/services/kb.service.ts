import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import { KbCategoryCode } from '../../../shared/enums/kb.enum';
import type {
  KbArticleSummaryDTO,
  KbArticleDTO,
  KbListParams,
  KbListQuery,
  TicketKbReferenceDTO,
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
};
