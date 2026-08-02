// Environmental Incident DTOs — mirror docs/api-battery.md §Nhóm 9.
// ⚠️ DTO KHÔNG có siteName (chỉ siteId) — map tên site client-side từ battery assets.
import {
  EnvironmentalIncidentTypeEnum,
  EnvironmentalIncidentStatusEnum,
} from '@/src/shared/enums/incident.enum';
import type { AlertSeverityEnum } from '@/src/shared/enums/alert.enum';

export {
  EnvironmentalIncidentTypeEnum,
  EnvironmentalIncidentStatusEnum,
} from '@/src/shared/enums/incident.enum';

export interface EnvironmentalIncidentDto {
  id: string;
  siteId: string;
  incidentType: EnvironmentalIncidentTypeEnum;
  status: EnvironmentalIncidentStatusEnum;
  severity: AlertSeverityEnum;
  reportedBy: string | null;
  detectedAt: string; // UTC
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  falseAlarmAt: string | null;
  falseAlarmReason: string | null;
  createdAt: string;
}

export interface IncidentListParams {
  pageNumber?: number;
  pageSize?: number;
  siteId?: string;
  status?: EnvironmentalIncidentStatusEnum;
  incidentType?: EnvironmentalIncidentTypeEnum;
  from?: string;
  to?: string;
}

export interface ResolveIncidentPayload {
  resolutionNote: string;
}

export const INCIDENT_TYPE_LABEL: Record<EnvironmentalIncidentTypeEnum, string> = {
  [EnvironmentalIncidentTypeEnum.Smoke]: 'Khói',
  [EnvironmentalIncidentTypeEnum.FireDetected]: 'Cháy',
  [EnvironmentalIncidentTypeEnum.GasLeak]: 'Rò rỉ khí',
  [EnvironmentalIncidentTypeEnum.Flood]: 'Ngập nước',
  [EnvironmentalIncidentTypeEnum.OverheatHazard]: 'Nguy cơ quá nhiệt',
  [EnvironmentalIncidentTypeEnum.Other]: 'Khác',
};

export const INCIDENT_STATUS_LABEL: Record<EnvironmentalIncidentStatusEnum, string> = {
  [EnvironmentalIncidentStatusEnum.Open]: 'Mở',
  [EnvironmentalIncidentStatusEnum.Acknowledged]: 'Đã xác nhận',
  [EnvironmentalIncidentStatusEnum.Resolved]: 'Đã xử lý',
  [EnvironmentalIncidentStatusEnum.FalseAlarm]: 'Báo nhầm',
};
