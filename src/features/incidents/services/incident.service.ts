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
  // GH-68 — Active incidents (Open+Acknowledged) by site, 1 server-side call.
  getActiveBySite: (siteId: string) =>
    axiosInstance.get<CommonResponse<PaginationResponse<EnvironmentalIncidentDto>>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.BY_SITE_ACTIVE(siteId),
    ),
  // Staff-only — POST, Open → Acknowledged. 409 if state ≠ Open. Returns the updated DTO.
  acknowledge: (id: string) =>
    axiosInstance.post<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.ACKNOWLEDGE(id),
    ),
  // Staff-only — POST { resolutionNote } (5–2000 characters). Returns the updated DTO.
  resolve: (id: string, payload: ResolveIncidentPayload) =>
    axiosInstance.post<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.RESOLVE(id),
      payload,
    ),
};
