import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import { BatteryAssetDto } from '../types/battery.types';

export const batteryService = {
  getMyAssets: (params?: { pageNumber?: number; pageSize?: number }) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryAssetDto>>>(
      ENDPOINTS.BATTERIES.MY_ASSETS,
      { params },
    ),
};
