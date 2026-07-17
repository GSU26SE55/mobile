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
  /** Chuỗi rỗng `""` cho alert cấp SITE (ambient 9/10/11, EnvironmentalIncident 14) — khi đó dùng `siteId`. */
  batteryAssetId: string;
  /** Sprint Bonus NS-21 (#661) — ID Site cho alert cấp site. `null` với alert gắn 1 pin cụ thể. */
  siteId: string | null;
  /** Rỗng `""` cho alert cấp site (không gắn pin). */
  batterySerialNumber: string;
  anomalyType: AnomalyTypeEnum;
  severity: AlertSeverityEnum;
  thresholdValue: number | null;
  actualValue: number | null;
  unit: string | null;
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

// Giá trị đo có thể null từ BE (thresholdValue/actualValue/unit là nullable).
export const formatMeasure = (
  value?: number | null,
  unit?: string | null,
): string => (value == null ? '—' : `${value}${unit ? ` ${unit}` : ''}`);
