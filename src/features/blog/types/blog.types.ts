import type { BlogPostStatusEnum, BlogPostOriginEnum } from '../enums/blog.enum';

export { BlogPostStatusEnum, BlogPostOriginEnum } from '../enums/blog.enum';

// ← BlogPostListItemDTO. Does NOT have contentHtml — the list screen renders plain <Text>.
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

// ← BlogPostDTO. Redeclares all fields, no extends (follows kb.types.ts convention).
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
  /** Search keyword matched against title / summary — filtered by BE, not client-side. */
  q?: string;
}

// Query sent to the BE — PascalCase.
// No `Status`: the public controller overrides Status = Published automatically.
export interface BlogListQuery {
  PageNumber?: number;
  PageSize?: number;
  Origin?: BlogPostOriginEnum;
  Q?: string;
}
