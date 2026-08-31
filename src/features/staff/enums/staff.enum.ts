// Hold reason uses the standard PauseReasonEnum from shared/enums/ticket.enum (matches api-ticket.md).
// The old HoldReasonEnum has been removed — avoid a duplicate source of truth.

// Mirrors AuthService's StaffSkillTierEnum. AuthService does NOT register a
// JsonStringEnumConverter, so the wire value is the raw int (1/2/3), not a string.
export const StaffSkillTierEnum = {
  Generalist: 1,
  ModuleSpecialist: 2,
  SeniorSpecialist: 3,
} as const;
export type StaffSkillTierEnum = (typeof StaffSkillTierEnum)[keyof typeof StaffSkillTierEnum];
