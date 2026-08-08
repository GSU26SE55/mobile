// Environmental Incident DTOs — mirror docs/api-battery.md §Group 9.
// ⚠️ DTO has NO siteName (only siteId) — map the site name client-side from battery assets.
import {
  EnvironmentalIncidentTypeEnum,
  EnvironmentalIncidentStatusEnum,
} from '@/src/features/incidents/enums/incident.enum';
import type { AlertSeverityEnum } from '@/src/shared/enums/alert.enum';

export {
  EnvironmentalIncidentTypeEnum,
  EnvironmentalIncidentStatusEnum,
} from '@/src/features/incidents/enums/incident.enum';

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
  [EnvironmentalIncidentTypeEnum.Smoke]: 'Smoke',
  [EnvironmentalIncidentTypeEnum.FireDetected]: 'Fire',
  [EnvironmentalIncidentTypeEnum.GasLeak]: 'Gas Leak',
  [EnvironmentalIncidentTypeEnum.Flood]: 'Flood',
  [EnvironmentalIncidentTypeEnum.OverheatHazard]: 'Overheat Hazard',
  [EnvironmentalIncidentTypeEnum.Other]: 'Other',
};

export const INCIDENT_STATUS_LABEL: Record<EnvironmentalIncidentStatusEnum, string> = {
  [EnvironmentalIncidentStatusEnum.Open]: 'Open',
  [EnvironmentalIncidentStatusEnum.Acknowledged]: 'Acknowledged',
  [EnvironmentalIncidentStatusEnum.Resolved]: 'Resolved',
  [EnvironmentalIncidentStatusEnum.FalseAlarm]: 'False Alarm',
};
