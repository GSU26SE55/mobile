export const BatteryStatusEnum = {
  Active: 1,
  Inactive: 2,
  Failed: 3,
} as const;
export type BatteryStatusEnum = (typeof BatteryStatusEnum)[keyof typeof BatteryStatusEnum];
