import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
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
