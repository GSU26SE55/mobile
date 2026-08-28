/**
 * Một mốc bảo trì định kỳ của pin (GET /api/battery-assets/{id}/maintenance-cycles).
 *
 * Khác `MaintenanceLogDTO` bên ticket: log đó là báo cáo công việc Staff ghi trong lúc xử
 * lý một ticket. Bản ghi này là nhật ký vòng đời của TÀI SẢN — kỳ này rơi vào lúc nào và
 * sức khoẻ pin tại thời điểm đó ra sao. Hệ thống tự ghi khi đến hạn, không cần ai thao tác.
 */
export interface MaintenanceCycleDto {
  id: string;
  batteryAssetId: string;
  cycleNo: number;
  /** Hạn theo kế hoạch của kỳ này. */
  dueAtUtc: string;
  /** Thời điểm hệ thống ghi mốc. */
  recordedAtUtc: string;
  /** SoH (%) tại mốc này — mốc so sánh sức khoẻ giữa các kỳ. */
  sohPercentAtCycle?: number | null;

  /**
   * Ticket bảo trì đã mở cho kỳ này, hoặc null khi chưa nối được.
   *
   * BatteryService ghi mốc TRƯỚC khi ticket tồn tại rồi mới nhận báo ngược, nên null là
   * trạng thái hợp lệ (kỳ vừa ghi, kỳ cũ chưa backfill) — không phải lỗi tải.
   */
  ticketId?: string | null;

  // Tình trạng pin trong kỳ vừa qua, BE chụp lúc ghi mốc.
  // Tất cả nullable: pin mất kết nối cả kỳ thì không có gì để tổng hợp.
  avgTemperatureCelsius?: number | null;
  maxTemperatureCelsius?: number | null;
  minVoltage?: number | null;
  maxVoltage?: number | null;
  cycleCountDelta?: number | null;
  alertCount?: number | null;
  criticalAlertCount?: number | null;
  /** Số bản ghi cảm biến dùng để tổng hợp — 0 nghĩa là pin mất kết nối cả kỳ. */
  readingCount?: number | null;
}
