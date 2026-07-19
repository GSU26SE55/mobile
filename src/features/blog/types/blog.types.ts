import type { BlogPostStatusEnum, BlogPostOriginEnum } from '../enums/blog.enum';

export { BlogPostStatusEnum, BlogPostOriginEnum } from '../enums/blog.enum';

// ← BlogPostListItemDTO. KHÔNG có contentHtml — màn list render <Text> thường.
export interface BlogPostSummaryDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: BlogPostStatusEnum;
  origin: BlogPostOriginEnum;
  authorUserId: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string | null;
}

// ← BlogPostDTO. Khai lại đủ field, không extends (theo convention kb.types.ts).
export interface BlogPostDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentHtml: string;
  status: BlogPostStatusEnum;
  origin: BlogPostOriginEnum;
  sourceKbArticleId: string | null;
  blogTemplateId: string | null;
  authorUserId: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface BlogListParams {
  pageNumber?: number;
  pageSize?: number;
  origin?: BlogPostOriginEnum;
}

// Query gửi lên BE — PascalCase.
// KHÔNG có `Status`: public controller tự ghi đè Status = Published.
export interface BlogListQuery {
  PageNumber?: number;
  PageSize?: number;
  Origin?: BlogPostOriginEnum;
}
