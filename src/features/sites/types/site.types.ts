// Site DTOs — mirror docs/api-battery.md §Nhóm 5.
import type { SiteStatusEnum } from '../enums/site.enum';

export { SiteStatusEnum } from '../enums/site.enum';

export interface SiteDto {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  installDate: string; // ISO 8601 UTC
  status: SiteStatusEnum;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  batteryAssetCount: number;
  activeBatteryAssetCount: number;
  createdAt: string;
}

// GET /api/sites/{id}/dashboard — ⚠️ KHÔNG có capacityKw/totalCapacityKw (doc cảnh báo rõ).
export interface SiteDashboardDto {
  siteId: string;
  name: string;
  customerId: string;
  totalAssets: number;       // gồm cả Inactive/Decommissioned
  activeAssets: number;
  assetsWithActiveAlerts: number; // chỉ alert Open/Acknowledged
  lastAlertAt: string | null;
  healthScore: number;       // 0–100, clamp; ngưỡng màu 80/50
}

export interface SiteListParams {
  pageNumber?: number;
  pageSize?: number;
}

export interface SiteAssetsParams {
  pageNumber?: number;
  pageSize?: number;
  status?: number; // BatteryStatusEnum
}
