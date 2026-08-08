import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import type {
  BlogPostSummaryDTO,
  BlogPostDTO,
  BlogListParams,
  BlogListQuery,
} from '../types/blog.types';

function toListQuery(params?: BlogListParams): BlogListQuery | undefined {
  if (!params) return undefined;
  const query: BlogListQuery = {};
  if (params.pageNumber !== undefined) query.PageNumber = params.pageNumber;
  if (params.pageSize !== undefined) query.PageSize = params.pageSize;
  if (params.origin) query.Origin = params.origin;
  // trim before checking — a whitespace-only string is treated as no filter.
  const q = params.q?.trim();
  if (q) query.Q = q;
  return Object.keys(query).length > 0 ? query : undefined;
}

export const blogService = {
  getList: (params?: BlogListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BlogPostSummaryDTO>>>(
      ENDPOINTS.BLOG.LIST,
      { params: toListQuery(params) },
    ),
  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<BlogPostDTO>>(ENDPOINTS.BLOG.DETAIL(id)),
};
