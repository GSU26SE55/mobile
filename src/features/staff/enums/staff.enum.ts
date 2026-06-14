// Hold reason dùng PauseReasonEnum chuẩn từ shared/enums/ticket.enum (khớp api-ticket.md).
// HoldReasonEnum cũ đã bỏ — tránh trùng lặp source-of-truth.

export const StaffSkillTierEnum = {
  Tier1: 'Tier1',
  Tier2: 'Tier2',
  Tier3: 'Tier3',
} as const;
export type StaffSkillTierEnum = (typeof StaffSkillTierEnum)[keyof typeof StaffSkillTierEnum];
