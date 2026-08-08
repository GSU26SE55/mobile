// Alert enums — shared cross-feature (battery view, notifications).
// Mirror docs/api-battery.md §Group 1 + FE shared/enums/alert.enum.ts.

export const AlertSeverityEnum = {
  Info: 1,
  Warning: 2,
  Critical: 3,
} as const;
export type AlertSeverityEnum =
  (typeof AlertSeverityEnum)[keyof typeof AlertSeverityEnum];

export const AlertStatusEnum = {
  Open: 1,
  Acknowledged: 2,
  Merged: 3,
  Resolved: 4,
} as const;
export type AlertStatusEnum =
  (typeof AlertStatusEnum)[keyof typeof AlertStatusEnum];

export const AnomalyTypeEnum = {
  Overheat: 1,
  Overvoltage: 2,
  Undervoltage: 3,
  LowSoc: 4,
  RapidDischarge: 5,
  AbnormalCharging: 6,
  DeviceOffline: 7,
  SohDegradation: 8,
  HighAmbientTemp: 9,
  HighHumidity: 10,
  HighTempHumidityCombo: 11,
  HighInternalResistance: 12,
  CellImbalance: 13,
  EnvironmentalIncident: 14,
  SensorMismatch: 15,
  Undertemp: 16, // Sprint Bonus NS-25 (#665) — wire value cross-service, mirror exactly 16
} as const;
export type AnomalyTypeEnum =
  (typeof AnomalyTypeEnum)[keyof typeof AnomalyTypeEnum];
