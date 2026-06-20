import type { TicketCategoryEnum } from '../../../shared/enums/ticket.enum';
import type { KbArticleStatusEnum } from '../../../shared/enums/kb.enum';

export { KbArticleStatusEnum } from '../../../shared/enums/kb.enum';

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
