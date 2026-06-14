// Alert DTOs — mirror docs/api-battery.md §Nhóm 1.
import type {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from '../../../shared/enums/alert.enum';

export {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from '../../../shared/enums/alert.enum';

export interface AlertDto {
  id: string;
  batteryAssetId: string;
  batterySerialNumber: string;
  anomalyType: AnomalyTypeEnum;
  severity: AlertSeverityEnum;
  thresholdValue: number;
  actualValue: number;
  unit: string;
  detectedAt: string; // UTC
  status: AlertStatusEnum;
  ticketId: string | null;
  acknowledgedByUserId: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  dedupWindowEndUtc: string;
  createdAt: string;
}

export interface AlertListParams {
  pageNumber?: number;
  pageSize?: number;
  batteryAssetId?: string;
  severity?: AlertSeverityEnum;
  status?: AlertStatusEnum;
  excludeMerged?: boolean;
  from?: string;
  to?: string;
}
