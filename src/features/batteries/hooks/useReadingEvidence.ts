import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import type { SensorReadingDto } from '../types/sensor-reading.types';
import { ANOMALY_LABEL } from '../components/AssetAlertList';

// Cửa sổ lấy log quanh `detectedAt`. ±2 phút, và con số này KHÔNG tự do chọn — phải khớp
// `BatteryInternalService.SnapshotWindow`, cửa sổ backend dùng dựng snapshot cho AI verify
// chấm điểm. Lệch nhau thì người đọc thấy verdict "khớp sensor" tính từ những số đo mà bảng
// ngay bên dưới không hề hiển thị.
//
// Cùng một bề rộng cho cả hai loại ticket, vì hai lý do khác nhau:
//   · `AutoFromAlert` — bộ quét đóng dấu đúng `Time` của số đo, nên chính dòng vi phạm nằm
//     giữa cửa sổ. Vài phút xung quanh mới là thứ khiến nó đọc được như một DIỄN BIẾN: warm-up
//     của simulator dắt pin đi lên dần (31→50→61→67→72°C), và cửa sổ ±15s cắt sạch phần đó,
//     chỉ còn một dòng số tròn trịa trông như bịa.
//   · `ManualByCustomer` (kể cả khi staff tạo hộ khách) — người khai báo nhớ "khoảng 3 giờ",
//     không phải 15:04:32.
//
// Cái giá phải trả, nói thẳng: hai case chạy trên cùng viên pin cách nhau dưới 2 phút sẽ lẫn
// log của nhau. Demo chạy từng case một, và mỗi dòng đều ghi rõ ngưỡng bị vượt nên dòng lạ
// nhìn ra ngay — nên đánh đổi nghiêng về phía kể được câu chuyện thay vì giấu nó đi.
export const EVIDENCE_WINDOW_MS = 2 * 60 * 1_000;

/**
 * Sensor log around the incident detection time (DetectedAt ± 15s) — used as EVIDENCE for
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
  // Both sides of DetectedAt: the run that triggered the alert sends several readings in a
  // burst, so the breach that tipped the counter can sit slightly before or after the stamp.
  const from = detectedAt
    ? new Date(new Date(detectedAt).getTime() - EVIDENCE_WINDOW_MS).toISOString()
    : undefined;
  const to = detectedAt
    ? new Date(new Date(detectedAt).getTime() + EVIDENCE_WINDOW_MS).toISOString()
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

/**
 * Thresholds come from the battery type's own `ThresholdConfig` — the very row `AnomalyRules`
 * on the backend reads to raise the alert. They must NOT be hardcoded here: the fleet mixes
 * 12V/24V/48V packs with different chemistries, so one set of numbers cannot describe them all,
 * and any constant we pick will silently drift away from what the backend actually enforced.
 *
 * Passing `undefined` disables every rule and yields no evidence rows — deliberate. Rows judged
 * against guessed limits are worse than no rows, because the reader would be cross-checking a
 * ticket against a threshold the system never applied.
 */
export interface EvidenceThresholds {
  temperatureMax: number;
  temperatureMin: number;
  socWarningThreshold: number;
  currentMaxCharge?: number | null;
  currentMaxDischarge?: number | null;
}

export interface ReadingWarning {
  reading: SensorReadingDto;
  reasons: string[]; // warning labels ("Overheat 72°C > 60°C"...)
}

/**
 * Gắn nhãn cảnh báo cho từng dòng số đo, dựa trên anomaly BE ĐÃ CHẤM (`reading.anomalies`).
 *
 * Trước đây hàm này tự so số đo với ngưỡng rồi tự ghép chuỗi — dựng lại luật của BE ở phía
 * client, và bản mobile còn thiếu HẲN rule điện áp: mọi Overvoltage/Undervoltage đều bị bỏ
 * qua, đúng loại cảnh báo an toàn mà BE xếp mức Critical. Nay BE chấm bằng
 * `AnomalyRules.Detect` với đúng ThresholdConfig của loại pin, client chỉ dịch sang nhãn.
 */
export function toWarningRows(readings: SensorReadingDto[]): ReadingWarning[] {
  return readings.map((r) => ({
    reading: r,
    reasons: (r.anomalies ?? []).map((a) => {
      const label = ANOMALY_LABEL[a.type] ?? a.type;
      // Số lẻ theo đơn vị: điện áp cần 2 chữ số mới phân biệt được, còn °C/%/A thì không.
      const digits = a.unit === 'V' ? 2 : 0;
      const actual = a.actualValue.toFixed(digits);
      const limit = a.thresholdValue.toFixed(digits);
      // Hướng so sánh suy từ chính số liệu, nên không cần bảng tra riêng cho từng loại.
      const op = a.actualValue > a.thresholdValue ? '>' : '<';
      return `${label} ${actual}${a.unit} ${op} ${limit}${a.unit}`;
    }),
  }));
}

/** Số dòng thực sự vượt ngưỡng — dùng cho badge đếm và câu tóm tắt phía trên bảng. */
export function countBreaches(rows: ReadingWarning[]): number {
  return rows.filter((r) => r.reasons.length > 0).length;
}
