import { ActivityActionEnum } from '../types/ticket.types';
import type { TicketActivityDTO, TicketDetailDTO, TicketDTO, TicketPriorityEnum, TicketStatusEnum } from '../types/ticket.types';

export const ACTIVE_TICKET_STATUSES: readonly TicketStatusEnum[] =
  ['Open', 'Pending', 'InProgress', 'Request', 'ReAssign', 'Completed'];
export const CLOSED_TICKET_STATUSES: readonly TicketStatusEnum[] = ['Closed', 'ClosedRejected'];
export const EXTERNAL_WAITING_STATUSES: readonly TicketStatusEnum[] = ['Request', 'ReAssign', 'Completed'];

export function isActiveTicket(status: TicketStatusEnum) {
  return ACTIVE_TICKET_STATUSES.includes(status);
}

export function isTerminalTicket(status: TicketStatusEnum) {
  return CLOSED_TICKET_STATUSES.includes(status);
}

// Chat bị khoá khi ticket đã hoàn thành: thread vẫn đọc được nhưng không gửi tin mới,
// không sửa/xoá tin cũ. Rộng hơn CLOSED_TICKET_STATUSES vì có thêm Completed — ticket đó
// vẫn ACTIVE (chờ Manager duyệt) nhưng phần trao đổi đã chốt. Khớp với web
// (shared/utils/ticket.utils.ts → isTicketChatLocked).
export const CHAT_LOCKED_TICKET_STATUSES: readonly TicketStatusEnum[] =
  ['Completed', ...CLOSED_TICKET_STATUSES];

export function isTicketChatLocked(status: TicketStatusEnum) {
  return CHAT_LOCKED_TICKET_STATUSES.includes(status);
}

/**
 * Log bảo trì bị khoá từ lúc Staff bấm hoàn thành, KHÔNG phải lúc ticket đóng: bản log đó
 * chính là thứ Manager dựa vào để duyệt, sửa được sau khi nộp thì buổi duyệt mất ý nghĩa.
 *
 * Mirror đúng guard của BE (MaintenanceLogUpdateCommandHandler: Completed || Closed → 403).
 * Trước đây mobile chỉ ẩn Edit khi ticket đã đóng, nên ở trạng thái "Review" nút vẫn hiện
 * và bấm vào chỉ nhận 403.
 *
 * Tính luôn ClosedRejected — BE không liệt kê nhưng ticket đã đóng thì không còn gì để sửa.
 */
export function isMaintenanceLogLocked(status: TicketStatusEnum) {
  return CHAT_LOCKED_TICKET_STATUSES.includes(status);
}

/**
 * Mốc bắt đầu lượt xử lý HIỆN TẠI — lần chuyển sang InProgress gần nhất, nên nó
 * reset sau mỗi Hold → Resume ("ticket này đang xử lý bao lâu rồi", không phải tổng
 * cộng dồn). Suy từ activity log đã fetch sẵn, không tốn thêm API.
 *
 * Dùng chung bởi đồng hồ Processing time trên màn chi tiết và ô Duration của log
 * bảo trì — hai con số đó buộc phải khớp nhau vì cùng một mốc.
 */
export function inProgressStartedAt(activities: TicketActivityDTO[]): string | null {
  const entries = activities.filter(
    a => a.action === ActivityActionEnum.StatusChanged && a.newValue === 'InProgress',
  );
  if (entries.length === 0) return null;
  return entries.reduce((latest, a) =>
    new Date(a.createdAt) > new Date(latest.createdAt) ? a : latest,
  ).createdAt;
}

export function isPrimaryHandler(ticket: Pick<TicketDTO, 'assignments'>, staffId?: string | null) {
  return !!staffId && ticket.assignments.some(a => a.staffId === staffId && a.role === 'PrimaryHandler');
}

export function canHold(ticket: TicketDTO, staffId?: string | null) {
  return ticket.status === 'InProgress' && ticket.priority !== 'Urgent' && isPrimaryHandler(ticket, staffId);
}

export function canResume(ticket: TicketDTO, staffId?: string | null) {
  return ticket.status === 'Pending' &&
    ticket.pendingContext === 'Held' &&
    isPrimaryHandler(ticket, staffId);
}

export function canEscalate(ticket: TicketDTO, staffId?: string | null) {
  return canHold(ticket, staffId);
}

export function canComplete(ticket: TicketDTO, staffId?: string | null) {
  return ticket.status === 'InProgress' && isPrimaryHandler(ticket, staffId);
}

export function shouldShowLiveSla(status: TicketStatusEnum, priority: TicketPriorityEnum | null, timerStatus?: string) {
  return status === 'InProgress' && priority !== 'Urgent' && timerStatus === 'Running';
}

/**
 * Wider than `shouldShowLiveSla`, for LIST rows: a queued or paused ticket still
 * has a deadline the reader needs to see, not just the one being worked on right
 * now. Detail screens keep the narrow predicate above — they show the full SLA
 * card, which only makes sense while the clock is actually running.
 *
 * `Urgent` tickets run without an SLA timer at all.
 */
export function showsSlaInList(
  status: TicketStatusEnum,
  priority: TicketPriorityEnum | null,
  timerStatus?: string,
) {
  if (isTerminalTicket(status) || priority === 'Urgent') return false;
  return timerStatus === 'Running' || timerStatus === 'Paused' || timerStatus === 'Breached';
}

export function canRateOrReopen(ticket: TicketDetailDTO, now = Date.now()) {
  if (ticket.status !== 'Closed' || ticket.mergedIntoTicketId || ticket.rating != null || !ticket.closedAt) return false;
  const closedAt = new Date(ticket.closedAt).getTime();
  return Number.isFinite(closedAt) && now <= closedAt + 7 * 24 * 60 * 60 * 1000;
}

export function detailRefetchInterval(ticket?: TicketDTO): number | false {
  if (!ticket) return false;
  if (ticket.status === 'InProgress') return 15_000;
  // Awaiting assignment — Manager can triage priority/assign staff any moment.
  if (ticket.status === 'Open') return 15_000;
  if (ticket.status === 'Pending') {
    if (ticket.pendingContext === 'Scheduled' && ticket.scheduledStartAtUtc) {
      const distance = Math.abs(new Date(ticket.scheduledStartAtUtc).getTime() - Date.now());
      if (distance <= 2 * 60_000) return 5_000;
    }
    return 30_000;
  }
  // Escalated/reassignment pending — Manager can act (reassign, priority change) any moment;
  // poll faster than the generic external-waiting statuses below.
  if (ticket.status === 'ReAssign') return 15_000;
  if (EXTERNAL_WAITING_STATUSES.includes(ticket.status)) {
    const changedAt = new Date(ticket.updatedAt ?? ticket.createdAt).getTime();
    return Date.now() - changedAt <= 10 * 60_000 ? 30_000 : 60_000;
  }
  return false;
}
