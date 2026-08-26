import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import { SensorReadingInterval } from '../types/sensor-reading.types';

interface UseSensorReadingAggregateOptions {
  hours: number; // how far back from now — `from` is recomputed on every fetch
  interval: SensorReadingInterval;
}

// GH-74 — endpoint switch threshold. `/aggregate` materializes rows in-memory (bounded to ~7 days);
// longer ranges should use `/aggregate/hourly` (continuous aggregate, ~O(bucket count)).
// docs/api-battery.md L957: range ≤ 7 days → /aggregate; longer range + fixed 1h interval → /aggregate/hourly.
const HOURLY_THRESHOLD_HOURS = 168; // 7 days

/**
 * Only switches to /aggregate/hourly when the range is long AND the caller actually wants 1h buckets.
 *
 * ⚠️ The `interval === '1h'` condition is REQUIRED, not redundant: /aggregate/hourly fixes the
 * bucket at 1h. If only `hours` were checked, SensorChart's 30-day range (interval '1d', 30
 * buckets) would get pushed to hourly and receive 720 buckets — 24x more, changing the chart's
 * shape and the performance of a component OUTSIDE this scope.
 */
function shouldUseHourly(opts: UseSensorReadingAggregateOptions): boolean {
  return opts.hours > HOURLY_THRESHOLD_HOURS && opts.interval === '1h';
}

// Bucket data for the chart — polls every 30s so the chart auto-updates on new readings.
export function useSensorReadingAggregate(
  assetId: string,
  opts: UseSensorReadingAggregateOptions,
) {
  const useHourly = shouldUseHourly(opts);

  return useQuery({
    queryKey: useHourly
      ? QUERY_KEY.sensorReadings.aggregateHourly(assetId, { hours: opts.hours })
      : QUERY_KEY.sensorReadings.aggregate(assetId, opts as unknown as Record<string, unknown>),
    queryFn: () => {
      const from = new Date(Date.now() - opts.hours * 3_600_000).toISOString();
      // Long range → hourly (do NOT send `interval` — the endpoint has a fixed 1h bucket).
      return useHourly
        ? sensorReadingService.getAggregateHourly(assetId, { from }).then((r) => r.data.data ?? [])
        : sensorReadingService
            .getAggregate(assetId, { from, interval: opts.interval })
            .then((r) => r.data.data ?? []);
    },
    enabled: !!assetId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
