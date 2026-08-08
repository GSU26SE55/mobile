import { useEffect, useRef, useState } from 'react';
import EventSource from 'react-native-sse';
import { BASE_URL } from '@/src/lib/axios';
import { getAccessToken } from '@/src/lib/secureStore';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { BatterySummaryDto, LiveReadingDto } from '../types/live-reading.types';
import {
  BatteryStatsDto,
  BatteryStatsView,
  StatsWindow,
  statsDtoToView,
} from '../types/sensor-reading.types';

// GH-58 — live SSE telemetry for MULTIPLE batteries at once (event `summary`).
// Reuses the GH-57 pattern (useBatterySensorStream) but scoped to multiple batteries → returns Map<assetId, reading>.
// Reusable scopes: `customer:{accountId}` (Customer) or `assets:{ids}` (Staff) — built via buildFleetScope.
// GH-74 — adds event `stats` (§5.3bis) → Map<assetId, {window → stats}>, same pattern as liveByAsset.
type StreamEvent = 'summary' | 'stats' | 'ping';

// BE fixes EXACTLY 2 windows (§5.3bis). An unknown window → ignored.
const VALID_WINDOWS: StatsWindow[] = ['1h', 'today'];

/** Stats for 1 battery, keyed by window. */
export type AssetStats = Partial<Record<StatsWindow, BatteryStatsView>>;

// react-native-sse's 'error' event can carry an HTTP status when the failure happens BEFORE the stream opens (§8 SSE).
interface SseErrorEvent {
  type: string;
  message?: string;
  xhrStatus?: number;
  xhrState?: number;
}

// Keep only the `primary` source (full BMS) — drop redundant/external-temp (§5.4).
function isPrimary(code?: string | null): boolean {
  return !code || code === 'primary';
}

export interface FleetStreamState {
  /** Map batteryAssetId → latest reading (primary only). Nullable fields may be ABSENT. */
  liveByAsset: Map<string, LiveReadingDto>;
  /** GH-74 — Map batteryAssetId → min/max charge-discharge by window. Empty until a `stats` event arrives. */
  statsByAsset: Map<string, AssetStats>;
  isConnected: boolean;
  /** true when SSE is rejected (401/403 — bad auth/scope). UI still shows the static values. */
  streamError: boolean;
}

/**
 * Opens 1 SSE connection for the given `scope` (summary + stats). `null` → do not open
 * (caller doesn't have enough data yet). State is NOT managed via TanStack Query (SSE is
 * push-based, not a query).
 *
 * GH-74 — `stats` also flows through a local Map like `liveByAsset`, NOT through the query
 * cache the way `useBatterySensorStream` does. Reason: the consumer (dashboard) renders each
 * battery inside `renderItem` — a callback, not a component — so calling `useQuery` per-battery
 * there would break the rules of hooks.
 */
export function useBatteryFleetStream(scope: string | null): FleetStreamState {
  const [liveByAsset, setLiveByAsset] = useState<Map<string, LiveReadingDto>>(new Map());
  const [statsByAsset, setStatsByAsset] = useState<Map<string, AssetStats>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const esRef = useRef<EventSource<StreamEvent> | null>(null);

  useEffect(() => {
    if (!scope) return;

    let cancelled = false;
    setStreamError(false);

    (async () => {
      const token = await getAccessToken();
      if (cancelled || !token) return;

      // BASE_URL has no /api (axios.ts); .replace guards against an env value with a trailing /api.
      const base = BASE_URL.replace(/\/api$/, '');
      const url =
        `${base}${ENDPOINTS.SENSOR_READINGS.STREAM}` +
        `?scope=${encodeURIComponent(scope)}&access_token=${encodeURIComponent(token)}`;

      const es = new EventSource<StreamEvent>(url, {
        // Token is already in the query (native EventSource doesn't set headers) — the header is only a best-effort addition.
        headers: { Authorization: `Bearer ${token}` },
      });
      esRef.current = es;

      es.addEventListener('open', () => {
        if (!cancelled) {
          setIsConnected(true);
          setStreamError(false);
        }
      });

      es.addEventListener('summary', (event) => {
        if (cancelled || !event.data) return;
        let payload: BatterySummaryDto;
        try {
          payload = JSON.parse(event.data) as BatterySummaryDto;
        } catch {
          return; // malformed payload → ignore, keep the old Map
        }
        const items = payload.items ?? [];
        if (items.length === 0) return;

        setLiveByAsset((prev) => {
          const next = new Map(prev);
          for (const item of items) {
            // Keep only primary; route by batteryAssetId, NOT scopeType.
            if (!isPrimary(item.sensorSourceCode)) continue;
            next.set(item.batteryAssetId, item);
          }
          return next;
        });
      });

      es.addEventListener('stats', (event) => {
        if (cancelled || !event.data) return;
        let dto: BatteryStatsDto;
        try {
          dto = JSON.parse(event.data) as BatteryStatsDto;
        } catch {
          return; // malformed payload → ignore, keep the old Map
        }
        // Unknown window (BE adds a 3rd window) → ignore.
        if (!VALID_WINDOWS.includes(dto.window)) return;

        setStatsByAsset((prev) => {
          const next = new Map(prev);
          // Route by batteryAssetId, NOT scopeType (same as `summary`).
          const cur = next.get(dto.batteryAssetId) ?? {};
          next.set(dto.batteryAssetId, { ...cur, [dto.window]: statsDtoToView(dto) });
          return next;
        });
      });

      // 'ping' (keepalive) → ignore. 'error' → do NOT swallow silently: log the status (§8).
      es.addEventListener('error', (event) => {
        if (cancelled) return;
        setIsConnected(false);
        const status = (event as SseErrorEvent).xhrStatus;
        if (status === 401 || status === 403) {
          // Failure BEFORE the stream opens (bad auth/scope) → do NOT blindly auto-retry (it will fail again).
          console.warn(`[useBatteryFleetStream] SSE ${status} — scope="${scope}" was rejected.`);
          setStreamError(true);
          es.close(); // block react-native-sse's useless reconnect on 401/403
        }
        // network drop / closed after opening → keep the old Map, let the lib auto-reconnect; the next summary reseeds it.
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
  }, [scope]);

  return { liveByAsset, statsByAsset, isConnected, streamError };
}
