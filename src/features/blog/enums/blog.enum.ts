// BE dùng JsonStringEnumConverter → mọi enum trả/nhận dạng CHUỖI.
// Wire value là 1..5 và 1..2 nhưng Mobile không thấy qua JSON — KHÔNG mirror số.
export const BlogPostStatusEnum = {
  Generating: 'Generating',
  GenerationFailed: 'GenerationFailed',
  Draft: 'Draft',
  Published: 'Published',
  Archived: 'Archived',
} as const;
export type BlogPostStatusEnum =
  (typeof BlogPostStatusEnum)[keyof typeof BlogPostStatusEnum];

export const BlogPostOriginEnum = {
  Manual: 'Manual',
  AiGeneratedFromKb: 'AiGeneratedFromKb',
} as const;
export type BlogPostOriginEnum =
  (typeof BlogPostOriginEnum)[keyof typeof BlogPostOriginEnum];

export const BlogOriginLabel: Record<BlogPostOriginEnum, string> = {
  [BlogPostOriginEnum.Manual]: 'Biên tập',
  [BlogPostOriginEnum.AiGeneratedFromKb]: 'Tổng hợp từ KB',
};
