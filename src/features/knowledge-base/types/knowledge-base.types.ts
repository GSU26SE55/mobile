import type { TicketCategoryEnum } from '../../../shared/enums/ticket.enum';
import { KbArticleStatusEnum } from '../enums/knowledge-base.enum';

export { KbArticleStatusEnum } from '../enums/knowledge-base.enum';

// Filter query gửi Category dạng SỐ (int) — BE GetKbArticleListQuery.Category là int.
// (Response trả enum chuỗi, nhưng request filter nhận int → cần map.)
export const CATEGORY_TO_INT: Record<TicketCategoryEnum, number> = {
  Charging: 1,
  Overheat: 2,
  NoPower: 3,
  Performance: 4,
  Other: 5,
  Repair: 6,
};

// Item trong danh sách (GET /api/knowledge-base) — KHÔNG có tags; CÓ reviewRequired + createdAt.
export interface KbArticleListItemDto {
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

// Chi tiết (GET /api/knowledge-base/{id}) — shape riêng, đầy đủ field.
export interface KbArticleDto {
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

// Kết quả suggest (GET /api/knowledge-base/suggest?TicketId=) — KHÔNG có category.
export interface KbArticleSuggestDto {
  id: string;
  code: string;
  title: string;
  symptoms: string;
  helpfulCount: number;
  viewCount: number;
}

export interface KbListParams {
  Q?: string;
  Category?: number; // int value của TicketCategoryEnum (xem CATEGORY_TO_INT)
  Tag?: string;
  PageNumber?: number;
  PageSize?: number;
}
