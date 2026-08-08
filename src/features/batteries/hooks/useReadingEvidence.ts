import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import type { SensorReadingDto } from '../types/sensor-reading.types';

// Evidence window: log around the incident detection time (DetectedAt ± minutes).
const EVIDENCE_WINDOW_MINUTES = 15;

/**
 * Sensor log around the incident detection time (DetectedAt ± 15') — used as EVIDENCE for
 * the ticket, NOT a current real-time log. Only rows that breach a threshold are shown
 * (see toWarningRows). Query is disabled if assetId or detectedAt is missing.
 *
 * Keep IN SYNC with web's `shared/hooks/battery/useReadingEvidence.ts` — if the window or
 * thresholds diverge between platforms, the same ticket would produce two different sets
 * of evidence.
 */
export function useReadingEvidence(
  assetId: string | null | undefined,
  detectedAt: string | null | undefined,
) {
  const from = detectedAt
    ? new Date(new Date(detectedAt).getTime() - EVIDENCE_WINDOW_MINUTES * 60_000).toISOString()
    : undefined;
  const to = detectedAt
    ? new Date(new Date(detectedAt).getTime() + EVIDENCE_WINDOW_MINUTES * 60_000).toISOString()
    : undefined;

  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.history(assetId ?? '', { from, to, limit: 200 }),
    queryFn: async () => {
      const res = await sensorReadingService.getHistory(assetId!, { from, to, limit: 200 });
      return res.data.data;
    },
    enabled: !!assetId && !!detectedAt,
  });
}

// Warning thresholds — only use signals that do NOT depend on pack voltage (the system has
// both 12V and 48V batteries → can't hardcode a voltage threshold). Consistent with AI verify:
// high temperature (safety) + low SOC (%). SOH is handled separately by AI verify (gRPC).
const TEMP_MAX = 45; // °C — overheat, a threshold universal across all battery types
const SOC_MIN = 15; // % — very low SOC

export interface ReadingWarning {
  reading: SensorReadingDto;
  reasons: string[]; // warning labels ("Overheat 47°C"...)
}

/** Filters warning readings + attaches reason labels. No warning → excluded from evidence. */
export function toWarningRows(readings: SensorReadingDto[]): ReadingWarning[] {
  const rows: ReadingWarning[] = [];
  for (const r of readings) {
    const reasons: string[] = [];
    if (r.temperature > TEMP_MAX) reasons.push(`Overheat ${r.temperature.toFixed(0)}°C`);
    if (r.socPercent < SOC_MIN) reasons.push(`Low SOC ${r.socPercent.toFixed(0)}%`);
    if (reasons.length > 0) rows.push({ reading: r, reasons });
  }
  return rows;
}
