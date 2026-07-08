// GH-56 — IoT Device. Nguồn: docs/api-battery.md §IotDeviceStatusEnum (dòng 182–188).
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
  [IotDeviceStatusEnum.Pending]: 'Chờ provision',
  [IotDeviceStatusEnum.Active]: 'Hoạt động',
  [IotDeviceStatusEnum.Offline]: 'Mất kết nối',
  [IotDeviceStatusEnum.Disabled]: 'Vô hiệu hoá',
  [IotDeviceStatusEnum.Decommissioned]: 'Ngừng sử dụng',
};

// UI const cho dropdown channel ở form calibration. BE nhận string tự do (lowercase),
// đây chỉ là tập gợi ý chuẩn (voltage/current/temperature/soc).
export const CalibrationChannel = {
  Voltage: 'voltage',
  Current: 'current',
  Temperature: 'temperature',
  Soc: 'soc',
} as const;
export type CalibrationChannel =
  (typeof CalibrationChannel)[keyof typeof CalibrationChannel];

export const CALIBRATION_CHANNEL_LABEL: Record<CalibrationChannel, string> = {
  [CalibrationChannel.Voltage]: 'Điện áp',
  [CalibrationChannel.Current]: 'Dòng điện',
  [CalibrationChannel.Temperature]: 'Nhiệt độ',
  [CalibrationChannel.Soc]: 'SOC',
};
