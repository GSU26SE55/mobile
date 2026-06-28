import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import { BatteryAssetDto } from '../../batteries/types/battery.types';
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
