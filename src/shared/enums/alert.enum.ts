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
  // > 50 outlier readings in an hour → the backend decommissions the device permanently.
  // Rare, but it DOES reach the alert table, so leaving it out rendered a bare "#17" for a
  // state that ends a device's life.
  IotDataIntegrityViolation: 17,
  // Gas concentration (MQ-2, %) breached AmbientThresholdConfig.HighGasWarning/Critical.
  HighGasConcentration: 18,
  // Water-leak sensor reported wet — bool, no threshold, always Critical.
  WaterLeak: 19,
} as const;
export type AnomalyTypeEnum =
  (typeof AnomalyTypeEnum)[keyof typeof AnomalyTypeEnum];
