// GH-56 — Battery Types. Mirror docs/api-battery.md §Group 3 (lines 584-623).
import type { BatteryChemistryEnum } from '../enums/battery-type.enum';
export { BatteryChemistryEnum } from '../enums/battery-type.enum';

export interface BatteryTypeDto {
  id: string;
  name: string;
  manufacturer: string | null;
  nominalCapacityAh: number;
  nominalVoltage: number;
  chemistry: BatteryChemistryEnum;
  maxCycleCount: number;
  description: string | null;
  createdAt: string; // ISO 8601 UTC
}

export interface BatteryTypeListParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string; // search by Name + Manufacturer (case-insensitive)
  includeDeleted?: boolean; // default false
}
