export const HoldReasonEnum = {
  WaitingCustomer: 'WaitingCustomer',
  WaitingParts: 'WaitingParts',
  WaitingOnsiteSchedule: 'WaitingOnsiteSchedule',
} as const;
export type HoldReasonEnum = (typeof HoldReasonEnum)[keyof typeof HoldReasonEnum];

export const StaffSkillTierEnum = {
  Tier1: 'Tier1',
  Tier2: 'Tier2',
  Tier3: 'Tier3',
} as const;
export type StaffSkillTierEnum = (typeof StaffSkillTierEnum)[keyof typeof StaffSkillTierEnum];
