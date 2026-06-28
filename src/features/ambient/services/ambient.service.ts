import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse } from '../../../types/api.types';
import {
  AmbientReadingDto,
  AmbientTrendPoint,
  AmbientTrendParams,
} from '../types/ambient.types';

export const ambientService = {
  getLatest: (siteId: string) =>
    axiosInstance.get<CommonResponse<AmbientReadingDto>>(
      ENDPOINTS.AMBIENT.LATEST,
      { params: { siteId } },
    ),
  getTrend: (siteId: string, params?: AmbientTrendParams) =>
    axiosInstance.get<CommonResponse<AmbientTrendPoint[]>>(
      ENDPOINTS.REPORTS.AMBIENT_TREND,
      { params: { siteId, ...params } },
    ),
};
