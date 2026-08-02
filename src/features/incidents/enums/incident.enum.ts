// Environmental Incident enums — cấp site (smoke/fire/flood…).
// Mirror docs/api-battery.md §Nhóm 9 (EnvironmentalIncidentTypeEnum / StatusEnum).
// ⚠️ StatusEnum.Resolved = 3 (KHÁC AlertStatusEnum.Resolved = 4) — KHÔNG tái dùng badge alert.
// Severity dùng chung AlertSeverityEnum (shared/enums/alert.enum.ts).

export const EnvironmentalIncidentTypeEnum = {
  Smoke: 1,
  FireDetected: 2,
  GasLeak: 3,
  Flood: 4,
  OverheatHazard: 5,
  Other: 99,
} as const;
export type EnvironmentalIncidentTypeEnum =
  (typeof EnvironmentalIncidentTypeEnum)[keyof typeof EnvironmentalIncidentTypeEnum];

export const EnvironmentalIncidentStatusEnum = {
  Open: 1,
  Acknowledged: 2,
  Resolved: 3,
  FalseAlarm: 4,
} as const;
export type EnvironmentalIncidentStatusEnum =
  (typeof EnvironmentalIncidentStatusEnum)[keyof typeof EnvironmentalIncidentStatusEnum];
