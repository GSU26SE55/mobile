import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import { AlertDto, AlertListParams } from '../types/alert.types';

export const alertService = {
  getList: (params?: AlertListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AlertDto>>>(
      ENDPOINTS.ALERTS.LIST,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<AlertDto>>(ENDPOINTS.ALERTS.DETAIL(id)),
  // Customer được ack alert của mình (Open → Acknowledged). 409 nếu Resolved/Merged.
  acknowledge: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(ENDPOINTS.ALERTS.ACKNOWLEDGE(id)),
};
