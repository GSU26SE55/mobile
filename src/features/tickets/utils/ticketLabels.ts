import { BadgeColors } from '@/src/lib/theme';
import type {
  EscalationReasonEnum,
  PendingContextEnum,
  PauseReasonEnum,
  TicketCategoryEnum,
  TicketPriorityEnum,
  TicketStatusEnum,
} from '../types/ticket.types';

// ─────────────────────────────────────────────────────────────────────────────
// The single vocabulary for every ticket surface. Before this, priority,
// category and status maps were duplicated across TicketCard, StaffTicketCard,
// the staff dashboard and both detail screens — and had already drifted
// ("Power outage" vs "Power loss", "Overheating" vs "Overheat").
// ─────────────────────────────────────────────────────────────────────────────

export type TicketAudience = 'customer' | 'staff';
export type CustomerLane = 'new' | 'inprocess' | 'pending' | 'complete' | 'closed' | 'reject';
export type StaffLane = 'process' | 'pending' | 'done';

interface StageMeta {
  /** Customer-facing word. Five in total, collapsed from eight backend states. */
  customerChip: string;
  /** Staff-facing word — keeps the operational distinctions staff triage on. */
  staffChip: string;
  tone: keyof typeof BadgeColors;
  customerLane: CustomerLane;
  staffLane: StaffLane;
}

/**
 * Typed `Record<TicketStatusEnum, …>` on purpose: neither list has an "All" tab
 * any more, so a status missing from this table would silently become
 * unreachable in the UI. This way it fails the build instead.
 *
 * The customer gets one lane per state they can act on or wait for. `Request`
 * (escalation asked) and `ReAssign` (waiting on a new handler) are internal
 * handling steps with no customer-side counterpart — telling a ticket's owner it
 * is "awaiting reassignment" adds a word they cannot act on — so both read as
 * in progress, the same as `InProgress`.
 *
 * Staff sort by who the ticket is waiting on, not by lifecycle position:
 * `Pending` (scheduled or held), `Request` (escalation sent up) and `ReAssign`
 * are all parked with somebody else, so they share one lane and stay out of the
 * list of work to actually do now. `Open` is unassigned and `getMyTickets` never
 * returns it; it is mapped defensively so the table stays exhaustive.
 */
export const TICKET_STAGE: Record<TicketStatusEnum, StageMeta> = {
  Open:           { customerChip: 'New',         staffChip: 'Unassigned',  tone: 'open',      customerLane: 'new',       staffLane: 'process' },
  Pending:        { customerChip: 'Scheduled',   staffChip: 'On hold',     tone: 'waiting',   customerLane: 'pending',   staffLane: 'pending' },
  InProgress:     { customerChip: 'In progress', staffChip: 'Working',     tone: 'progress',  customerLane: 'inprocess', staffLane: 'process' },
  Request:        { customerChip: 'In progress', staffChip: 'Escalated',   tone: 'escalated', customerLane: 'inprocess', staffLane: 'pending' },
  ReAssign:       { customerChip: 'In progress', staffChip: 'Reassigning', tone: 'escalated', customerLane: 'inprocess', staffLane: 'pending' },
  Completed:      { customerChip: 'Completed',   staffChip: 'Review',      tone: 'resolved',  customerLane: 'complete',  staffLane: 'done' },
  Closed:         { customerChip: 'Closed',      staffChip: 'Closed',      tone: 'closed',    customerLane: 'closed',    staffLane: 'done' },
  ClosedRejected: { customerChip: 'Declined',    staffChip: 'Rejected',    tone: 'crit',      customerLane: 'reject',    staffLane: 'done' },
};

/** Short status word for a card row, in the vocabulary that audience speaks. */
export function ticketChip(status: TicketStatusEnum, audience: TicketAudience): string {
  const stage = TICKET_STAGE[status];
  if (!stage) return status;
  return audience === 'customer' ? stage.customerChip : stage.staffChip;
}

export function ticketTone(status: TicketStatusEnum): keyof typeof BadgeColors {
  return TICKET_STAGE[status]?.tone ?? 'new';
}

export function customerLaneOf(status: TicketStatusEnum): CustomerLane | null {
  return TICKET_STAGE[status]?.customerLane ?? null;
}

export function staffLaneOf(status: TicketStatusEnum): StaffLane | null {
  return TICKET_STAGE[status]?.staffLane ?? null;
}

// ── Priority ────────────────────────────────────────────────────────────────

interface PriorityMeta {
  /** Two characters, for the loud pill on a list row. */
  code: string;
  short: string;
  long: string;
  chipBg: string;
  chipText: string;
}

const UNTRIAGED: PriorityMeta = {
  code: '—',
  short: 'Untriaged',
  long: 'Awaiting triage',
  chipBg: BadgeColors.new.bg,
  chipText: BadgeColors.new.text,
};

// chipBg/chipText are the designed accessible pairs (≥4.5:1). The pill is made
// loud by size and weight, not by dropping to white-on-red, which fails AA.
const PRIORITY: Record<TicketPriorityEnum, PriorityMeta> = {
  P1Critical: { code: 'P1', short: 'P1 Critical', long: 'P1 Critical', chipBg: BadgeColors.p1.bg, chipText: BadgeColors.p1.text },
  P2High:     { code: 'P2', short: 'P2 High',     long: 'P2 High',     chipBg: BadgeColors.p2.bg, chipText: BadgeColors.p2.text },
  P3Normal:   { code: 'P3', short: 'P3 Normal',   long: 'P3 Normal',   chipBg: BadgeColors.p3.bg, chipText: BadgeColors.p3.text },
  // Urgent tickets run without an SLA timer (see shouldShowLiveSla).
  Urgent:     { code: '!',  short: 'Urgent',      long: 'Urgent',      chipBg: BadgeColors.p1.bg, chipText: BadgeColors.p1.text },
};

/** Priority is null until a Manager triages — never fall back to P3. */
export function priorityMeta(priority: TicketPriorityEnum | null): PriorityMeta {
  return priority ? (PRIORITY[priority] ?? UNTRIAGED) : UNTRIAGED;
}

// ── Category ────────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<TicketCategoryEnum, string> = {
  Charging: 'Charging',
  Overheat: 'Overheating',
  NoPower: 'Power outage',
  Performance: 'Performance',
  Repair: 'Repair',
  Other: 'Other',
};

export const categoryLabel = (category: string) =>
  CATEGORY_LABELS[category as TicketCategoryEnum] ?? category;

// ── Long-form labels ────────────────────────────────────────────────────────
// Precise wording, for the staff detail screen where there is room for it.
// Cards and filters use `ticketChip` instead.

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

export const ESCALATION_REASON_LABELS: Record<EscalationReasonEnum, string> = {
  SkillGap: 'Exceeds technical capability',
  PartsRequired: 'Parts required',
  SafetyConcern: 'Safety concern',
  SlaBreach: 'SLA breached',
  CustomerComplaint: 'Customer complaint',
};

export const escalationReasonLabel = (reason: string) =>
  ESCALATION_REASON_LABELS[reason as EscalationReasonEnum] ?? reason;

export const ticketStatusLabel = (status: string) =>
  TICKET_STATUS_LABELS[status as TicketStatusEnum] ?? status;
