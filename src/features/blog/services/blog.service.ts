import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
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
