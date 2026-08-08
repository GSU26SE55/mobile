import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import { AlertDto, AlertListParams } from '../types/alert.types';

export const alertService = {
  getList: (params?: AlertListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AlertDto>>>(
      ENDPOINTS.ALERTS.LIST,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<AlertDto>>(ENDPOINTS.ALERTS.DETAIL(id)),
  // Customer can acknowledge their own alert (Open → Acknowledged). 409 if Resolved/Merged.
  acknowledge: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(ENDPOINTS.ALERTS.ACKNOWLEDGE(id)),
  // GH-55 — Staff-only: PATCH, Open/Acknowledged → Resolved. 409 if Merged.
  resolve: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(ENDPOINTS.ALERTS.RESOLVE(id)),
};
