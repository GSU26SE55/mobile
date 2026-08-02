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

// GH-58 — SSE telemetry live cho NHIỀU pin cùng lúc (event `summary`).
// Reuse pattern GH-57 (useBatterySensorStream) nhưng scope nhiều pin → trả Map<assetId, reading>.
// Reusable: scope `customer:{accountId}` (Customer) hoặc `assets:{ids}` (Staff) — dựng qua buildFleetScope.
// GH-74 — thêm event `stats` (§5.3bis) → Map<assetId, {window → stats}>, cùng pattern với liveByAsset.
type StreamEvent = 'summary' | 'stats' | 'ping';

// BE chốt ĐÚNG 2 window (§5.3bis). Window lạ → bỏ qua.
const VALID_WINDOWS: StatsWindow[] = ['1h', 'today'];

/** stats của 1 pin, khoá theo window. */
export type AssetStats = Partial<Record<StatsWindow, BatteryStatsView>>;

// react-native-sse 'error' event có thể mang HTTP status khi lỗi TRƯỚC lúc mở stream (§8 SSE).
interface SseErrorEvent {
  type: string;
  message?: string;
  xhrStatus?: number;
  xhrState?: number;
}

// Chỉ giữ source `primary` (BMS đầy đủ) — bỏ redundant/external-temp (§5.4).
function isPrimary(code?: string | null): boolean {
  return !code || code === 'primary';
}

export interface FleetStreamState {
  /** Map batteryAssetId → reading mới nhất (chỉ primary). Field nullable có thể VẮNG. */
  liveByAsset: Map<string, LiveReadingDto>;
  /** GH-74 — Map batteryAssetId → min/max nạp-xả theo window. Rỗng cho tới khi có event `stats`. */
  statsByAsset: Map<string, AssetStats>;
  isConnected: boolean;
  /** true khi SSE bị từ chối (401/403 — sai auth/scope). UI vẫn show giá trị tĩnh. */
  streamError: boolean;
}

/**
 * Mở 1 SSE connection theo `scope` (summary + stats). `null` → không mở (caller chưa đủ dữ liệu).
 * KHÔNG quản state bằng TanStack Query (SSE là push, không phải query).
 *
 * GH-74 — `stats` cũng đi qua Map local như `liveByAsset`, KHÔNG qua query cache như
 * `useBatterySensorStream` làm. Lý do: consumer (dashboard) render pin trong `renderItem` —
 * là callback chứ không phải component → gọi `useQuery` per-pin ở đó sẽ vỡ rules-of-hooks.
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

      // BASE_URL không có /api (axios.ts); .replace phòng env có đuôi /api.
      const base = BASE_URL.replace(/\/api$/, '');
      const url =
        `${base}${ENDPOINTS.SENSOR_READINGS.STREAM}` +
        `?scope=${encodeURIComponent(scope)}&access_token=${encodeURIComponent(token)}`;

      const es = new EventSource<StreamEvent>(url, {
        // Token đã ở query (native EventSource không set header) — header chỉ best-effort thêm.
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
          return; // payload lỗi → bỏ qua, giữ Map cũ
        }
        const items = payload.items ?? [];
        if (items.length === 0) return;

        setLiveByAsset((prev) => {
          const next = new Map(prev);
          for (const item of items) {
            // Chỉ giữ primary; route bằng batteryAssetId, KHÔNG dùng scopeType.
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
          return; // payload lỗi → bỏ qua, giữ Map cũ
        }
        // Window lạ (BE thêm window thứ 3) → bỏ qua.
        if (!VALID_WINDOWS.includes(dto.window)) return;

        setStatsByAsset((prev) => {
          const next = new Map(prev);
          // Route bằng batteryAssetId, KHÔNG dùng scopeType (giống `summary`).
          const cur = next.get(dto.batteryAssetId) ?? {};
          next.set(dto.batteryAssetId, { ...cur, [dto.window]: statsDtoToView(dto) });
          return next;
        });
      });

      // 'ping' (keepalive) → bỏ qua. 'error' → KHÔNG nuốt im lặng: log status (§8).
      es.addEventListener('error', (event) => {
        if (cancelled) return;
        setIsConnected(false);
        const status = (event as SseErrorEvent).xhrStatus;
        if (status === 401 || status === 403) {
          // Lỗi TRƯỚC khi mở stream (sai auth/scope) → KHÔNG auto-retry mù (sẽ lỗi lại).
          console.warn(`[useBatteryFleetStream] SSE ${status} — scope="${scope}" bị từ chối.`);
          setStreamError(true);
          es.close(); // chặn react-native-sse reconnect vô ích với 401/403
        }
        // network / đóng sau khi mở → giữ Map cũ, để lib tự reconnect; summary kế seed lại.
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
