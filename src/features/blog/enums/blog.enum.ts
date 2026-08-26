// BE uses JsonStringEnumConverter → all enums are sent/received as STRINGS.
// Wire values are 1..5 and 1..2 but Mobile never sees them through JSON — do NOT mirror the numbers.
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
  [BlogPostOriginEnum.Manual]: 'Editorial',
  [BlogPostOriginEnum.AiGeneratedFromKb]: 'Generated from KB',
};
