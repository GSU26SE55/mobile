import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import {
  BatteryAssetDto,
  BatteryAssetRealtimeDto,
  BatteryAssetListParams,
} from '../types/battery.types';
import { CascadeRiskDto } from '../types/cascade.types';
import { MaintenanceCycleDto } from '../types/maintenance-cycle.types';

export const batteryService = {
  getMyAssets: (params?: BatteryAssetListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryAssetDto>>>(
      ENDPOINTS.BATTERY_ASSETS.MY,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryAssetDto>>(
      ENDPOINTS.BATTERY_ASSETS.DETAIL(id),
    ),
  getRealtime: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryAssetRealtimeDto>>(
      ENDPOINTS.BATTERY_ASSETS.REALTIME(id),
    ),
  getCascadeRisk: (id: string) =>
    axiosInstance.get<CommonResponse<CascadeRiskDto>>(
      ENDPOINTS.BATTERY_ASSETS.CASCADE_RISK(id),
    ),

  getMaintenanceCycles: (id: string) =>
    axiosInstance.get<CommonResponse<MaintenanceCycleDto[]>>(
      ENDPOINTS.BATTERY_ASSETS.MAINTENANCE_CYCLES(id),
    ),
};
