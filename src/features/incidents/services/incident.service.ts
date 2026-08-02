import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import {
  EnvironmentalIncidentDto,
  IncidentListParams,
  ResolveIncidentPayload,
} from '../types/incident.types';

export const incidentService = {
  getList: (params?: IncidentListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<EnvironmentalIncidentDto>>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.LIST,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.DETAIL(id),
    ),
  // GH-68 — incident đang Active (Open+Acknowledged) theo site, 1 call server-side.
  getActiveBySite: (siteId: string) =>
    axiosInstance.get<CommonResponse<PaginationResponse<EnvironmentalIncidentDto>>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.BY_SITE_ACTIVE(siteId),
    ),
  // Staff-only — POST, Open → Acknowledged. 409 nếu state ≠ Open. Trả DTO mới.
  acknowledge: (id: string) =>
    axiosInstance.post<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.ACKNOWLEDGE(id),
    ),
  // Staff-only — POST { resolutionNote } (5–2000 ký tự). Trả DTO mới.
  resolve: (id: string, payload: ResolveIncidentPayload) =>
    axiosInstance.post<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.RESOLVE(id),
      payload,
    ),
};
