import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { sensorReadingService } from '../services/sensor-reading.service';
import type { SensorReadingDto } from '../types/sensor-reading.types';

// Evidence window around DetectedAt. Deliberately narrow: an auto ticket comes from ONE scan
// pass, and the readings that triggered it land within seconds of DetectedAt. A ±15' window
// swept in readings from *other* cases run minutes earlier on the same battery — an Undertemp
// ticket ended up displaying the 72°C row belonging to an Overheat ticket.
const AUTO_WINDOW_MS = 15 * 1_000; // ±15s — mốc do máy đóng dấu, khớp mili-giây
// ±2' cho mốc người nhập. Con số này KHÔNG tự do chọn — phải khớp
// `BatteryInternalService.SnapshotWindow`, cửa sổ backend dùng dựng snapshot cho AI verify
// chấm điểm. Lệch nhau thì người đọc thấy verdict "khớp sensor" tính từ những số đo mà bảng
// ngay bên dưới không hề hiển thị, và không có cách nào đối chiếu.
const MANUAL_WINDOW_MS = 2 * 60 * 1_000;

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
  isManualReport = false,
) {
  const windowMs = isManualReport ? MANUAL_WINDOW_MS : AUTO_WINDOW_MS;
  // Both sides of DetectedAt: the run that triggered the alert sends several readings in a
  // burst, so the breach that tipped the counter can sit slightly before or after the stamp.
  const from = detectedAt
    ? new Date(new Date(detectedAt).getTime() - windowMs).toISOString()
    : undefined;
  const to = detectedAt
    ? new Date(new Date(detectedAt).getTime() + windowMs).toISOString()
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
 * Keeps only the readings that breach the battery type's configured limits, labelling each with
 * the measured value AND the limit it crossed, so the row itself shows why it is evidence.
 *
 * Every anomaly the backend can raise from a reading needs a rule here. Undertemp used to be
 * missing, and the gap was not cosmetic: a −18°C reading matched nothing and vanished from the
 * list, while a 72°C row left over from an earlier Overheat run on the same battery did match
 * and took its place — the Undertemp ticket displayed "Overheat 72°C" as its own evidence.
 * A missing rule does not merely hide a row; it hands the slot to a neighbouring case.
 */
export function toWarningRows(
  readings: SensorReadingDto[],
  thresholds?: EvidenceThresholds | null,
): ReadingWarning[] {
  if (!thresholds) return [];

  const rows: ReadingWarning[] = [];
  for (const r of readings) {
    const reasons: string[] = [];

    if (r.temperature > thresholds.temperatureMax)
      reasons.push(
        `Overheat ${r.temperature.toFixed(0)}°C > ${thresholds.temperatureMax.toFixed(0)}°C`,
      );
    if (r.temperature < thresholds.temperatureMin)
      reasons.push(
        `Low temp ${r.temperature.toFixed(0)}°C < ${thresholds.temperatureMin.toFixed(0)}°C`,
      );
    if (r.socPercent < thresholds.socWarningThreshold)
      reasons.push(
        `Low SOC ${r.socPercent.toFixed(0)}% < ${thresholds.socWarningThreshold.toFixed(0)}%`,
      );

    // Current carries direction in its sign: positive = charging, negative = discharging.
    // Both limits are nullable in the config — a null column means the backend never raises
    // that anomaly for this battery type, so we must not invent a limit of our own.
    if (thresholds.currentMaxCharge != null && r.current > thresholds.currentMaxCharge)
      reasons.push(
        `Charge current ${r.current.toFixed(0)}A > ${thresholds.currentMaxCharge.toFixed(0)}A`,
      );
    if (thresholds.currentMaxDischarge != null && r.current < -thresholds.currentMaxDischarge)
      reasons.push(
        `Discharge current ${Math.abs(r.current).toFixed(0)}A > ${thresholds.currentMaxDischarge.toFixed(0)}A`,
      );

    // Giữ CẢ dòng không vi phạm. Trước đây lọc bỏ chúng, nên một ticket có đầy đủ số đo
    // nhưng đều trong ngưỡng lại hiện bảng trống — người đọc hiểu thành "không có dữ liệu"
    // và mất luôn căn cứ để bác một ticket khai khống. Số đo bình thường quanh thời điểm
    // khai báo CŨNG là bằng chứng, chỉ là bằng chứng theo chiều ngược lại.
    rows.push({ reading: r, reasons });
  }
  return rows;
}

/** Số dòng thực sự vượt ngưỡng — dùng cho badge đếm và câu tóm tắt phía trên bảng. */
export function countBreaches(rows: ReadingWarning[]): number {
  return rows.filter((r) => r.reasons.length > 0).length;
}
