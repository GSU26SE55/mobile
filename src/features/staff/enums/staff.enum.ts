// Hold reason uses the standard PauseReasonEnum from shared/enums/ticket.enum (matches api-ticket.md).
// The old HoldReasonEnum has been removed — avoid a duplicate source of truth.

export const StaffSkillTierEnum = {
  Tier1: 'Tier1',
  Tier2: 'Tier2',
  Tier3: 'Tier3',
} as const;
export type StaffSkillTierEnum = (typeof StaffSkillTierEnum)[keyof typeof StaffSkillTierEnum];
