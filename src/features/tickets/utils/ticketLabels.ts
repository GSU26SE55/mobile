import type { PendingContextEnum, PauseReasonEnum, TicketStatusEnum } from '../types/ticket.types';

export const TICKET_STATUS_LABELS: Record<TicketStatusEnum, string> = {
  Open: 'Awaiting assignment',
  Pending: 'Pending',
  InProgress: 'In progress',
  Request: 'Escalation requested',
  ReAssign: 'Awaiting reassignment',
  Completed: 'Awaiting review',
  Closed: 'Closed',
  ClosedRejected: 'Rejected',
};

export const PENDING_CONTEXT_LABELS: Record<PendingContextEnum, string> = {
  Scheduled: 'Scheduled work', Held: 'Work on hold',
};
export const PAUSE_REASON_LABELS: Record<PauseReasonEnum, string> = {
  CustomerUnavailable: 'Customer unavailable', WorkBlocked: 'Work blocked',
};

export const ticketStatusLabel = (status: string) =>
  TICKET_STATUS_LABELS[status as TicketStatusEnum] ?? status;
