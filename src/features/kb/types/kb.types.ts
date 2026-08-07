import type { TicketCategoryEnum } from '@/src/shared/enums/ticket.enum';
import type { KbArticleStatusEnum, KbReferenceTypeEnum } from '@/src/shared/enums/kb.enum';

export { KbArticleStatusEnum, KbReferenceTypeEnum } from '@/src/shared/enums/kb.enum';

export interface KbArticleSummaryDTO {
  id: string;
  code: string;
  title: string;
  category: TicketCategoryEnum;
  status: KbArticleStatusEnum;
  viewCount: number;
  helpfulCount: number;
  reviewRequired: boolean;
  createdAt: string;
}

export interface KbArticleDTO {
  id: string;
  code: string;
  category: TicketCategoryEnum;
  title: string;
  symptoms: string;
  diagnosisSteps: string;
  solutionSteps: string;
  recommendedParts: string[] | null;
  tags: string[];
  status: KbArticleStatusEnum;
  isInternalOnly: boolean;
  version: number;
  viewCount: number;
  helpfulCount: number;
  reviewRequired: boolean;
  pendingReviewBy: string | null;
  managerRejectReason: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface TicketKbReferenceDTO {
  id: string;
  ticketId: string;
  kbArticleId: string;
  kbArticleCode: string;
  kbArticleTitle?: string | null;
  referencedByUserId: string;
  referenceType: string;
  note?: string | null;
  createdAt: string;
}

// GH-44 #7 — GET /knowledge-base/suggest. Shape KHÁC KbArticleSummaryDTO (có symptoms, không category/status).
export interface KbArticleSuggestDTO {
  id: string;
  code: string;
  title: string;
  symptoms: string;
  helpfulCount: number;
  viewCount: number;
}

// GH-44 #5 — POST /knowledge-base/references. referenceType gửi BE dạng chuỗi.
export interface AddKbReferencePayload {
  ticketId: string;
  kbArticleId: string;
  referenceType: KbReferenceTypeEnum;
  note?: string;
}

export interface KbListParams {
  pageNumber?: number;
  pageSize?: number;
  q?: string;
  category?: TicketCategoryEnum;
  tag?: string;
}

export interface KbListQuery {
  PageNumber?: number;
  PageSize?: number;
  Q?: string;
  Category?: number;
  Tag?: string;
}
