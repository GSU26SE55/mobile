// Alert DTOs — mirror docs/api-battery.md §Group 1.
import type {
  AlertSeverityEnum,
  AlertStatusEnum,
  AnomalyTypeEnum,
} from '@/src/shared/enums/alert.enum';
import type { EnvironmentalIncidentTypeEnum } from '@/src/features/incidents/enums/incident.enum';

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
  /** Device-level alerts (DeviceOffline, IotDataIntegrityViolation) carry no battery. Empty for battery/site alerts. */
  iotDeviceId: string | null;
  iotDeviceCode: string;
  iotDeviceName: string;
  /** Site the alert belongs to. Empty when the alert has no site. */
  siteName: string;
  /** Customer who owns this alert. Empty string when the account cannot be resolved. */
  customerName: string;
  anomalyType: AnomalyTypeEnum;
  /** Set only when this alert is the copy written alongside an EnvironmentalIncident — lets the
   * screen show the real incident type instead of a meaningless "Environmental incident" row. */
  environmentalIncidentId: string | null;
  incidentType: EnvironmentalIncidentTypeEnum | null;
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
  /** Filters site-level alerts (no battery to filter on via batteryAssetId). */
  siteId?: string;
  severity?: AlertSeverityEnum;
  status?: AlertStatusEnum;
  excludeMerged?: boolean;
  anomalyType?: AnomalyTypeEnum;
  /** Excludes EVERY site-level alert (no battery attached). Ignored when anomalyType is sent. */
  excludeEnvironmentalIncidents?: boolean;
  /** Opposite of excludeEnvironmentalIncidents — ONLY site-level alerts. Ignored when anomalyType is sent. */
  siteLevelOnly?: boolean;
  /** Only DeviceOffline + IotDataIntegrityViolation. Ignored when anomalyType is sent. */
  iotOnly?: boolean;
  /** Opposite of iotOnly. Ignored when anomalyType is sent. */
  excludeIotDeviceAlerts?: boolean;
  from?: string;
  to?: string;
}

// Measured values may be null from BE (thresholdValue/actualValue/unit are nullable).
export const formatMeasure = (
  value?: number | null,
  unit?: string | null,
): string => (value == null ? '—' : `${value}${unit ? ` ${unit}` : ''}`);
