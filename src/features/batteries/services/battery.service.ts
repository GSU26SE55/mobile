import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import {
  BatteryAssetDto,
  BatteryAssetRealtimeDto,
  BatteryAssetListParams,
} from '../types/battery.types';

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
};
