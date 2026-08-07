import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import { BatteryTypeDto, BatteryTypeListParams } from '../types/battery-type.types';
import { ThresholdConfigDto } from '../types/threshold.types';

// GH-56 — Battery Types (read-only cho Staff).
export const batteryTypeService = {
  getList: (params?: BatteryTypeListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryTypeDto>>>(
      ENDPOINTS.BATTERY_TYPES.LIST,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryTypeDto>>(ENDPOINTS.BATTERY_TYPES.DETAIL(id)),
  /** Ngưỡng cảnh báo hiện hành của 1 loại pin. BE trả 404 nếu chưa cấu hình. */
  getThresholdByType: (batteryTypeId: string) =>
    axiosInstance.get<CommonResponse<ThresholdConfigDto>>(
      ENDPOINTS.THRESHOLDS.BY_TYPE(batteryTypeId),
    ),
};
