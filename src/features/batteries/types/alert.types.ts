// Alert DTOs — mirror docs/api-battery.md §Group 1.
import type {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from '@/src/shared/enums/alert.enum';

export {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from '@/src/shared/enums/alert.enum';

export interface AlertDto {
  id: string;
  /** Empty string `""` for SITE-level alerts (ambient 9/10/11, EnvironmentalIncident 14) — use `siteId` in that case. */
  batteryAssetId: string;
  /** Sprint Bonus NS-21 (#661) — Site ID for site-level alerts. `null` for alerts tied to a specific battery. */
  siteId: string | null;
  /** Empty `""` for site-level alerts (not tied to a battery). */
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

// Measured values may be null from BE (thresholdValue/actualValue/unit are nullable).
export const formatMeasure = (
  value?: number | null,
  unit?: string | null,
): string => (value == null ? '—' : `${value}${unit ? ` ${unit}` : ''}`);
