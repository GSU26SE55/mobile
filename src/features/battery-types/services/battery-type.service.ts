import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import { BatteryTypeDto, BatteryTypeListParams } from '../types/battery-type.types';

// GH-56 — Battery Types (read-only cho Staff).
export const batteryTypeService = {
  getList: (params?: BatteryTypeListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryTypeDto>>>(
      ENDPOINTS.BATTERY_TYPES.LIST,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryTypeDto>>(ENDPOINTS.BATTERY_TYPES.DETAIL(id)),
};
