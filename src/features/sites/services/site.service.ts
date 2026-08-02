import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import { BatteryAssetDto } from '@/src/features/batteries/types/battery.types';
import {
  SiteDto,
  SiteDashboardDto,
  SiteListParams,
  SiteAssetsParams,
} from '../types/site.types';

export const siteService = {
  getMySites: (params?: SiteListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<SiteDto>>>(
      ENDPOINTS.SITES.MY,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<SiteDto>>(ENDPOINTS.SITES.DETAIL(id)),
  getDashboard: (id: string) =>
    axiosInstance.get<CommonResponse<SiteDashboardDto>>(
      ENDPOINTS.SITES.DASHBOARD(id),
    ),
  getAssets: (id: string, params?: SiteAssetsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryAssetDto>>>(
      ENDPOINTS.SITES.ASSETS(id),
      { params },
    ),
};
