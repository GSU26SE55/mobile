// Battery Asset DTOs — mirror docs/api-battery.md §Group 2.
import type {
  BatteryStatusEnum,
  WarrantyStatusEnum,
  ChargingStateEnum,
} from '../enums/battery.enum';

export {
  BatteryStatusEnum,
  WarrantyStatusEnum,
  ChargingStateEnum,
} from '../enums/battery.enum';

export interface BatteryAssetDto {
  id: string;
  serialNumber: string;
  batteryTypeId: string;
  batteryTypeName: string;
  siteId: string | null;
  siteName: string | null;
  customerId: string;
  customerName: string;
  installDate: string; // ISO 8601 UTC
  warrantyEndDate: string | null;
  warrantyStatus: WarrantyStatusEnum;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  status: BatteryStatusEnum;
  notes: string | null;
  lastSensorReadingAt: string | null;
  createdAt: string;
}

// GET /api/battery-assets/{id}/realtime — snapshot: status + latest reading + active alerts.
export interface BatteryAssetRealtimeDto {
  assetId: string;
  serialNumber: string;
  status: BatteryStatusEnum;
  time: string | null; // null if no reading yet
  voltage: number | null;
  current: number | null; // negative = discharging
  temperature: number | null;
  socPercent: number | null;
  cycleCount: number | null;
  sohPercent: number | null; // null if AI hasn't computed it yet
  chargingState: ChargingStateEnum | null;
  activeAlerts: number;
}

export interface BatteryAssetListParams {
  pageNumber?: number;
  pageSize?: number;
}
