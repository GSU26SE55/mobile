import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import { AlertDto, AlertListParams } from '../types/alert.types';

// Read-only — không có acknowledge/resolve (ngoài scope GH-24).
export const alertService = {
  getList: (params?: AlertListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AlertDto>>>(
      ENDPOINTS.ALERTS.LIST,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<AlertDto>>(ENDPOINTS.ALERTS.DETAIL(id)),
};
