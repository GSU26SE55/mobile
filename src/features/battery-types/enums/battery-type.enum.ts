// GH-56 — Battery Types. Source: docs/api-battery.md §BatteryChemistryEnum (lines 61-69).
// Pattern `as const` object + type alias — do NOT use TypeScript enum.

export const BatteryChemistryEnum = {
  LiFePO4: 1,
  Nmc: 2,
  Nca: 3,
  Lco: 4,
  Other: 99,
} as const;
export type BatteryChemistryEnum =
  (typeof BatteryChemistryEnum)[keyof typeof BatteryChemistryEnum];

// Display label keyed by int value (BE returns a number).
export const BATTERY_CHEMISTRY_LABEL: Record<BatteryChemistryEnum, string> = {
  [BatteryChemistryEnum.LiFePO4]: 'LiFePO4',
  [BatteryChemistryEnum.Nmc]: 'NMC',
  [BatteryChemistryEnum.Nca]: 'NCA',
  [BatteryChemistryEnum.Lco]: 'LCO',
  [BatteryChemistryEnum.Other]: 'Other',
};
