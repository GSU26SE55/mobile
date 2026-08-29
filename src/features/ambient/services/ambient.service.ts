import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse } from '@/src/types/api.types';
import {
  AmbientHistoryParams,
  AmbientThresholdConfigDto,
  AmbientHistoryResponse,
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
  // Backend filters by Time >= From / Time <= To (GetAmbientReadingHistoryQuery),
  // so no client-side trimming.
  getHistory: (params: AmbientHistoryParams) =>
    axiosInstance.get<CommonResponse<AmbientHistoryResponse>>(
      ENDPOINTS.AMBIENT.HISTORY,
      { params },
    ),
  // data is null when the site has no ambient threshold configured yet — BE returns
  // 200 for that (a successful query with an empty result), not 404.
  getThresholdBySite: (siteId: string) =>
    axiosInstance.get<CommonResponse<AmbientThresholdConfigDto | null>>(
      ENDPOINTS.AMBIENT.THRESHOLD_BY_SITE(siteId),
    ),
  getTrend: (siteId: string, params?: AmbientTrendParams) =>
    axiosInstance.get<CommonResponse<AmbientTrendPoint[]>>(
      ENDPOINTS.REPORTS.AMBIENT_TREND,
      { params: { siteId, ...params } },
    ),
};
