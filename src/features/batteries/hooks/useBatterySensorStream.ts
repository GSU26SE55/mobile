import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import EventSource from 'react-native-sse';
import { BASE_URL } from '../../../lib/axios';
import { getAccessToken } from '../../../lib/secureStore';
import { ENDPOINTS } from '../../../lib/endpoints';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { BatteryAssetRealtimeDto } from '../types/battery.types';
import { LiveReadingDto } from '../types/live-reading.types';
import { ChargingStateEnum } from '../enums/battery.enum';

// GH-57 — SSE telemetry live cho Battery detail (docs/battery-realtime-description.md).
// Realtime AUGMENTS, polling /realtime (useBatteryAssetRealtime) là seed + fallback + re-seed.
// Merge field WHITELIST vào cache realtime — KHÔNG đè nguyên payload (mất serialNumber/status/activeAlerts).
type StreamEvent = 'reading' | 'ping';

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
