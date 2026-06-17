// Knowledge Base article status — `as const` object + type alias (không dùng TS enum).
// Khớp BE KbArticleStatusEnum (Draft=1, PendingReview=2, Published=3, Archived=4).
// Response serialize dạng chuỗi (JsonStringEnumConverter) → FE dùng string values.
export const KbArticleStatusEnum = {
  Draft: 'Draft',
  PendingReview: 'PendingReview',
  Published: 'Published',
  Archived: 'Archived',
} as const;
export type KbArticleStatusEnum = (typeof KbArticleStatusEnum)[keyof typeof KbArticleStatusEnum];
