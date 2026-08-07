import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import type { SensorReadingDto } from '../types/sensor-reading.types';

// Cửa sổ bằng chứng: log quanh thời điểm phát hiện sự cố (DetectedAt ± phút).
const EVIDENCE_WINDOW_MINUTES = 15;

/**
 * Log cảm biến quanh thời điểm phát hiện sự cố (DetectedAt ± 15') — làm BẰNG CHỨNG cho
 * ticket, KHÔNG phải log real-time hiện tại. Chỉ dòng vượt ngưỡng mới được hiển thị
 * (xem toWarningRows). Tắt query nếu thiếu assetId hoặc detectedAt.
 *
 * Giữ ĐỒNG BỘ với web `shared/hooks/battery/useReadingEvidence.ts` — hai bên lệch cửa sổ
 * hoặc lệch ngưỡng thì cùng một ticket lại ra hai bộ bằng chứng khác nhau.
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

// Ngưỡng cảnh báo — chỉ dùng tín hiệu KHÔNG phụ thuộc điện áp pack (hệ thống có cả pin
// 12V lẫn 48V → không hardcode ngưỡng voltage được). Nhất quán với AI verify: nhiệt độ
// cao (an toàn) + SOC thấp (%). SOH do AI verify (gRPC) lo riêng.
const TEMP_MAX = 45; // °C — quá nhiệt, chuẩn phổ quát mọi loại pin
const SOC_MIN = 15; // % — SOC rất thấp

export interface ReadingWarning {
  reading: SensorReadingDto;
  reasons: string[]; // nhãn warning ("Quá nhiệt 47°C"...)
}

/** Lọc reading warning + gắn nhãn lý do. Không warning → không đưa vào bằng chứng. */
export function toWarningRows(readings: SensorReadingDto[]): ReadingWarning[] {
  const rows: ReadingWarning[] = [];
  for (const r of readings) {
    const reasons: string[] = [];
    if (r.temperature > TEMP_MAX) reasons.push(`Quá nhiệt ${r.temperature.toFixed(0)}°C`);
    if (r.socPercent < SOC_MIN) reasons.push(`SOC thấp ${r.socPercent.toFixed(0)}%`);
    if (reasons.length > 0) rows.push({ reading: r, reasons });
  }
  return rows;
}
