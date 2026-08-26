import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import EventSource from 'react-native-sse';
import { BASE_URL } from '@/src/lib/axios';
import { getAccessToken } from '@/src/lib/secureStore';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { BatteryAssetRealtimeDto } from '../types/battery.types';
import { LiveReadingDto } from '../types/live-reading.types';
import { ChargingStateEnum } from '../enums/battery.enum';
import {
  BatteryStatsDto,
  BatteryStatsView,
  StatsWindow,
  statsDtoToView,
} from '../types/sensor-reading.types';

// GH-57 — live SSE telemetry for the Battery detail screen (docs/battery-realtime-description.md).
// Realtime AUGMENTS; polling /realtime (useBatteryAssetRealtime) is the seed + fallback + reseed.
// Merges a field WHITELIST into the realtime cache — does NOT overwrite the whole payload (would lose serialNumber/status/activeAlerts).
// GH-74 — adds event `stats` (§5.3bis): rolling min/max charge-discharge, written to cache key stats(assetId, window),
// read by useBatteryStats. `stats` pushes incrementally → the initial seed is handled by useBatteryStats.
type StreamEvent = 'reading' | 'stats' | 'ping';

// BE fixes EXACTLY 2 windows (§5.3bis). An unknown window → ignored, not written to cache.
const VALID_WINDOWS: StatsWindow[] = ['1h', 'today'];

export function useBatterySensorStream(assetId: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource<StreamEvent> | null>(null);

  useEffect(() => {
    if (!assetId) return;

    let cancelled = false;

    (async () => {
      const token = await getAccessToken();
      if (cancelled || !token) return;

      // BASE_URL has no /api (axios.ts); .replace guards against an env value with a trailing /api.
      const base = BASE_URL.replace(/\/api$/, '');
      const url =
        `${base}${ENDPOINTS.SENSOR_READINGS.STREAM}` +
        `?scope=asset:${assetId}&access_token=${encodeURIComponent(token)}`;

      const es = new EventSource<StreamEvent>(url, {
        // Token is already in the query (native EventSource doesn't set headers) — the header is only a best-effort addition.
        headers: { Authorization: `Bearer ${token}` },
      });
      esRef.current = es;

      es.addEventListener('open', () => {
        if (!cancelled) setIsConnected(true);
      });

      es.addEventListener('reading', (event) => {
        if (!event.data) return;
        let dto: LiveReadingDto;
        try {
          dto = JSON.parse(event.data) as LiveReadingDto;
        } catch {
          return; // malformed payload → ignore, polling keeps running
        }
        // Only accept the matching battery + primary source (or absent — treated as primary).
        if (dto.batteryAssetId !== assetId) return;
        if (dto.sensorSourceCode && dto.sensorSourceCode !== 'primary') return;

        queryClient.setQueryData<BatteryAssetRealtimeDto | null | undefined>(
          QUERY_KEY.batteryAssets.realtime(assetId),
          (old) =>
            old
              ? {
                  ...old,
                  time: dto.time,
                  voltage: dto.voltage,
                  current: dto.current,
                  temperature: dto.temperature,
                  socPercent: dto.socPercent,
                  // nullable fields may be ABSENT in the SSE JSON → ?? null.
                  sohPercent: dto.sohPercent ?? null,
                  cycleCount: dto.cycleCount ?? null,
                  chargingState: (dto.chargingState ?? null) as ChargingStateEnum | null,
                }
              : old, // no seed from polling yet → wait, don't create an object missing fields
        );
      });

      es.addEventListener('stats', (event) => {
        if (!event.data) return;
        let dto: BatteryStatsDto;
        try {
          dto = JSON.parse(event.data) as BatteryStatsDto;
        } catch {
          return; // malformed payload → ignore, keep the old value
        }
        // Only accept the matching battery (same as the `reading` event).
        if (dto.batteryAssetId !== assetId) return;
        // Unknown window (BE adds a 3rd window) → ignore instead of writing a junk cache key.
        if (!VALID_WINDOWS.includes(dto.window)) return;

        // Overwrites useBatteryStats' REST seed — SSE stats are always newer.
        queryClient.setQueryData<BatteryStatsView | null>(
          QUERY_KEY.sensorReadings.stats(assetId, dto.window),
          statsDtoToView(dto),
        );
      });

      // 'ping' (30s keepalive) → ignore. error → swallow, keep the polling fallback.
      es.addEventListener('error', () => {
        if (!cancelled) setIsConnected(false);
      });
    })();

    return () => {
      cancelled = true;
      setIsConnected(false);
      const es = esRef.current;
      esRef.current = null;
      if (es) {
        es.removeAllEventListeners();
        es.close();
      }
    };
  }, [assetId, queryClient]);

  return { isConnected };
}
