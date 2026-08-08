import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import {
  BatteryStatsView,
  SensorReadingAggregateDto,
  StatsWindow,
} from '../types/sensor-reading.types';

// Window start marker (UTC) — '1h' = start of the current hour, 'today' = 00:00 UTC today.
function windowStartOf(window: StatsWindow): Date {
  const d = new Date();
  d.setUTCMilliseconds(0);
  d.setUTCSeconds(0);
  d.setUTCMinutes(0);
  if (window === 'today') d.setUTCHours(0);
  return d;
}

function aggregateToSeed(agg: SensorReadingAggregateDto, window: StatsWindow): BatteryStatsView {
  return {
    window,
    windowStart: agg.time,
    maxChargeCurrent: agg.maxChargeCurrent,
    minChargeCurrent: agg.minChargeCurrent,
    maxDischargeCurrent: agg.maxDischargeCurrent,
    minDischargeCurrent: agg.minDischargeCurrent,
    chargeSampleCount: agg.chargeSampleCount,
    dischargeSampleCount: agg.dischargeSampleCount,
    updatedAt: agg.time,
    isSeed: true,
  };
}

/**
 * Min/max charge-discharge current for 1 window of 1 battery.
 *
 * Data source: SSE event `stats` (pushed via `useBatterySensorStream` → `setQueryData` on the
 * same key). This hook ONLY handles the seed: `stats` pushes incrementally (§5.3bis) so there's
 * nothing on screen-open — seed once from the last bucket of REST `/aggregate` so the UI isn't empty.
 *
 * `staleTime: Infinity` + no `refetchInterval`: fetch exactly once, then let SSE take over.
 * On refetch, a stale seed would OVERWRITE newer SSE data.
 *
 * `Realtime:Enabled=false` → `stats` never arrives → the view keeps the seed (`isSeed: true`).
 * This is a VALID state, not an error.
 */
export function useBatteryStats(assetId: string, window: StatsWindow) {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEY.sensorReadings.stats(assetId, window);

  return useQuery<BatteryStatsView | null>({
    queryKey,
    queryFn: async () => {
      // Race guard: a `stats` event can arrive WHILE the seed fetch is in flight (or already
      // arrived from a previous mount). Without this guard, the older seed would OVERWRITE
      // newer SSE data when the fetch resolves.
      const existing = queryClient.getQueryData<BatteryStatsView | null>(queryKey);
      if (existing && !existing.isSeed) return existing;

      const start = windowStartOf(window);
      const res = await sensorReadingService.getAggregate(assetId, {
        from: start.toISOString(),
        interval: window === 'today' ? '1d' : '1h',
      });
      const buckets = res.data.data ?? [];
      // Last bucket = current window. Empty (battery has no reading in this window) → null, UI shows '—'.
      const last = buckets.length > 0 ? buckets[buckets.length - 1] : null;
      return last ? aggregateToSeed(last, window) : null;
    },
    enabled: !!assetId,
    staleTime: Infinity,
  });
}
