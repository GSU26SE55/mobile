// GH-56 — Battery Types. Nguồn: docs/api-battery.md §BatteryChemistryEnum (dòng 61–69).
// Pattern `as const` object + type alias — KHÔNG dùng TypeScript enum.

export const BatteryChemistryEnum = {
  LiFePO4: 1,
  Nmc: 2,
  Nca: 3,
  Lco: 4,
  Other: 99,
} as const;
export type BatteryChemistryEnum =
  (typeof BatteryChemistryEnum)[keyof typeof BatteryChemistryEnum];

// Nhãn hiển thị theo int value (BE trả số).
export const BATTERY_CHEMISTRY_LABEL: Record<BatteryChemistryEnum, string> = {
  [BatteryChemistryEnum.LiFePO4]: 'LiFePO4',
  [BatteryChemistryEnum.Nmc]: 'NMC',
  [BatteryChemistryEnum.Nca]: 'NCA',
  [BatteryChemistryEnum.Lco]: 'LCO',
  [BatteryChemistryEnum.Other]: 'Khác',
};
