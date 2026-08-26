// GH-56 — IoT Device. Source: docs/api-battery.md §IotDeviceStatusEnum (lines 182–188).
// Pattern `as const` object + type alias.

export const IotDeviceStatusEnum = {
  Pending: 1,
  Active: 2,
  Offline: 3,
  Disabled: 4,
  Decommissioned: 5,
} as const;
export type IotDeviceStatusEnum =
  (typeof IotDeviceStatusEnum)[keyof typeof IotDeviceStatusEnum];

export const IOT_DEVICE_STATUS_LABEL: Record<IotDeviceStatusEnum, string> = {
  [IotDeviceStatusEnum.Pending]: 'Pending provision',
  [IotDeviceStatusEnum.Active]: 'Active',
  [IotDeviceStatusEnum.Offline]: 'Offline',
  [IotDeviceStatusEnum.Disabled]: 'Disabled',
  [IotDeviceStatusEnum.Decommissioned]: 'Decommissioned',
};

// UI const for the channel dropdown in the calibration form. BE accepts a free-form string (lowercase),
// this is just the standard suggestion set (voltage/current/temperature/soc).
export const CalibrationChannel = {
  Voltage: 'voltage',
  Current: 'current',
  Temperature: 'temperature',
  Soc: 'soc',
} as const;
export type CalibrationChannel =
  (typeof CalibrationChannel)[keyof typeof CalibrationChannel];

export const CALIBRATION_CHANNEL_LABEL: Record<CalibrationChannel, string> = {
  [CalibrationChannel.Voltage]: 'Voltage',
  [CalibrationChannel.Current]: 'Current',
  [CalibrationChannel.Temperature]: 'Temperature',
  [CalibrationChannel.Soc]: 'SOC',
};
