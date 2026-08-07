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

// GH-57 — SSE telemetry live cho Battery detail (docs/battery-realtime-description.md).
// Realtime AUGMENTS, polling /realtime (useBatteryAssetRealtime) là seed + fallback + re-seed.
// Merge field WHITELIST vào cache realtime — KHÔNG đè nguyên payload (mất serialNumber/status/activeAlerts).
// GH-74 — thêm event `stats` (§5.3bis): min/max nạp-xả rolling, ghi vào cache key stats(assetId, window),
// useBatteryStats đọc ra. `stats` đẩy incremental → seed ban đầu do useBatteryStats lo.
type StreamEvent = 'reading' | 'stats' | 'ping';

// BE chốt ĐÚNG 2 window (§5.3bis). Window lạ → bỏ qua, không ghi cache.
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

      // BASE_URL không có /api (axios.ts); .replace phòng env có đuôi /api.
      const base = BASE_URL.replace(/\/api$/, '');
      const url =
        `${base}${ENDPOINTS.SENSOR_READINGS.STREAM}` +
        `?scope=asset:${assetId}&access_token=${encodeURIComponent(token)}`;

      const es = new EventSource<StreamEvent>(url, {
        // Token đã ở query (native EventSource không set header) — header chỉ best-effort thêm.
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
          return; // payload lỗi → bỏ qua, polling vẫn chạy
        }
        // Chỉ nhận đúng pin + source primary (hoặc vắng — coi như primary).
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
                  // field nullable có thể VẮNG trong JSON SSE → ?? null.
                  sohPercent: dto.sohPercent ?? null,
                  cycleCount: dto.cycleCount ?? null,
                  chargingState: (dto.chargingState ?? null) as ChargingStateEnum | null,
                }
              : old, // chưa có seed từ polling → chờ, không tạo object thiếu field
        );
      });

      es.addEventListener('stats', (event) => {
        if (!event.data) return;
        let dto: BatteryStatsDto;
        try {
          dto = JSON.parse(event.data) as BatteryStatsDto;
        } catch {
          return; // payload lỗi → bỏ qua, giữ giá trị cũ
        }
        // Chỉ nhận đúng pin (giống event `reading`).
        if (dto.batteryAssetId !== assetId) return;
        // Window lạ (BE thêm window thứ 3) → bỏ qua thay vì ghi cache key rác.
        if (!VALID_WINDOWS.includes(dto.window)) return;

        // Đè seed REST của useBatteryStats — stats từ SSE luôn mới hơn.
        queryClient.setQueryData<BatteryStatsView | null>(
          QUERY_KEY.sensorReadings.stats(assetId, dto.window),
          statsDtoToView(dto),
        );
      });

      // 'ping' (30s keepalive) → bỏ qua. error → swallow, giữ polling fallback.
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
