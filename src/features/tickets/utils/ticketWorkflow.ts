import type { TicketDetailDTO, TicketDTO, TicketPriorityEnum, TicketStatusEnum } from '../types/ticket.types';

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

export function isPrimaryHandler(ticket: Pick<TicketDTO, 'assignments'>, staffId?: string | null) {
  return !!staffId && ticket.assignments.some(a => a.staffId === staffId && a.role === 'PrimaryHandler');
}

export function canHold(ticket: TicketDTO, staffId?: string | null) {
  return ticket.status === 'InProgress' && ticket.priority !== 'Urgent' && isPrimaryHandler(ticket, staffId);
}

export function canResume(ticket: TicketDTO, staffId?: string | null) {
  return ticket.status === 'Pending' &&
    (ticket.pendingContext === 'Held' || ticket.pendingContext === 'Scheduled') &&
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

export function canRateOrReopen(ticket: TicketDetailDTO, now = Date.now()) {
  if (ticket.status !== 'Closed' || ticket.mergedIntoTicketId || ticket.rating != null || !ticket.closedAt) return false;
  const closedAt = new Date(ticket.closedAt).getTime();
  return Number.isFinite(closedAt) && now <= closedAt + 7 * 24 * 60 * 60 * 1000;
}

export function detailRefetchInterval(ticket?: TicketDTO): number | false {
  if (!ticket) return false;
  if (ticket.status === 'InProgress') return 15_000;
  if (ticket.status === 'Pending') {
    if (ticket.pendingContext === 'Scheduled' && ticket.scheduledStartAtUtc) {
      const distance = Math.abs(new Date(ticket.scheduledStartAtUtc).getTime() - Date.now());
      if (distance <= 2 * 60_000) return 5_000;
    }
    return 30_000;
  }
  if (EXTERNAL_WAITING_STATUSES.includes(ticket.status)) {
    const changedAt = new Date(ticket.updatedAt ?? ticket.createdAt).getTime();
    return Date.now() - changedAt <= 10 * 60_000 ? 30_000 : 60_000;
  }
  return false;
}
