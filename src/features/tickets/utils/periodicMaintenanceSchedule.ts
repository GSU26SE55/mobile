import { TicketStatusEnum } from '@/src/shared/enums/ticket.enum';
import type { TicketDetailDTO } from '../types/ticket.types';

/**
 * Quy tắc chọn giờ cho chuyến bảo trì định kỳ, tách khỏi màn hình để kiểm thử được.
 *
 * Backend là nơi quyết định cuối cùng — mọi luật ở đây đều được kiểm lại một lần nữa ở
 * `CustomerSchedulePeriodicMaintenanceCommandHandler`. Bản trên máy khách tồn tại để người
 * dùng biết ngay tại chỗ vì sao một giờ không chọn được, thay vì bấm gửi rồi nhận lỗi.
 */

/** Ticket đang ở trạng thái cho phép khách chọn giờ. */
export function canCustomerSchedule(
  ticket: Pick<
    TicketDetailDTO,
    'isPeriodicMaintenance' | 'status' | 'scheduledStartAtUtc' | 'periodicMaintenanceScheduleDeadlineAtUtc'
  >,
  now: Date = new Date(),
): boolean {
  if (!ticket.isPeriodicMaintenance) return false;

  // Ticket đã được giao thì lịch thuộc về Manager, không phải khách.
  if (ticket.status !== TicketStatusEnum.Open) return false;

  // Đã chọn rồi thì thôi — đổi lịch là việc của Manager, và phải có lý do.
  if (ticket.scheduledStartAtUtc) return false;

  const deadline = ticket.periodicMaintenanceScheduleDeadlineAtUtc;
  if (!deadline) return false;

  return new Date(deadline).getTime() > now.getTime();
}

export type ScheduleRejection = 'past' | 'after-deadline' | 'no-deadline';

/**
 * Lý do một giờ cụ thể không hợp lệ, hoặc `null` nếu chọn được.
 */
export function validateChosenTime(
  chosen: Date,
  deadlineIso: string | null,
  now: Date = new Date(),
): ScheduleRejection | null {
  if (chosen.getTime() < now.getTime()) return 'past';
  if (!deadlineIso) return 'no-deadline';
  if (chosen.getTime() > new Date(deadlineIso).getTime()) return 'after-deadline';
  return null;
}

/**
 * Câu giải thích cho người dùng. Nêu hạn chót cụ thể chứ không chỉ nói "không hợp lệ" —
 * người đọc cần biết chọn tới lúc nào thì được.
 */
export function rejectionMessage(
  reason: ScheduleRejection,
  deadlineIso: string | null,
  formatDateTime: (value: string) => string,
): string {
  switch (reason) {
    case 'past':
      return 'Please pick a time in the future.';
    case 'after-deadline':
      return deadlineIso
        ? `Please pick a time before ${formatDateTime(deadlineIso)}.`
        : 'The time you picked is past the scheduling deadline.';
    case 'no-deadline':
      return 'This ticket has no scheduling window. Please contact support.';
  }
}

/**
 * Còn bao nhiêu ngày để chọn, làm tròn lên. `0` nghĩa là hết hôm nay.
 *
 * Làm tròn lên chứ không xuống: còn 1 giờ mà hiện "0 ngày" thì đọc như đã hết hạn, trong khi
 * khách vẫn chọn được.
 */
export function daysLeftToSchedule(deadlineIso: string | null, now: Date = new Date()): number | null {
  if (!deadlineIso) return null;
  const ms = new Date(deadlineIso).getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
