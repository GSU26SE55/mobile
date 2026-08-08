// #697 — read ticket staff assignments (replacing the removed `assignedStaffId`).
// The backend only returns staffId (UUID), without a name.

import { TicketAssignmentDTO } from '../types/ticket.types';

/** Primary responsible staff member; null when the ticket is unassigned. */
export function getPrimaryHandlerId(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string | null {
  return assignments?.find((a) => a.role === 'PrimaryHandler')?.staffId ?? null;
}

/** Number of supporting staff members; excluded from workload. */
export function countSupporters(
  assignments: TicketAssignmentDTO[] | undefined | null,
): number {
  return assignments?.filter((a) => a.role === 'Supporter').length ?? 0;
}

/**
 * Display name for an assignment. The backend includes `staffName` from the synced
 * StaffAccount, so no `/api/staff` call is required. Fall back to the staff ID.
 */
export function assignmentDisplayName(a: TicketAssignmentDTO): string {
  return a.staffName?.trim() || a.staffId;
}

/** Primary handler name; null when unassigned. */
export function getPrimaryHandlerName(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string | null {
  const primary = assignments?.find((a) => a.role === 'PrimaryHandler');
  return primary ? assignmentDisplayName(primary) : null;
}

/** Supporting staff names. */
export function getSupporterNames(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string[] {
  return (assignments ?? [])
    .filter((a) => a.role === 'Supporter')
    .map(assignmentDisplayName);
}

/**
 * Compact list-card summary. Names are omitted when multiple people are assigned
 * to avoid overflow; the detail screen shows every assignee.
 */
export function assignmentSummary(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string {
  const primary = getPrimaryHandlerName(assignments);
  const names = [...(primary ? [primary] : []), ...getSupporterNames(assignments)];
  if (names.length === 0) return 'Unassigned';
  if (names.length === 1) return names[0];
  return `${names.length} assignees`;
}

/** Whether `userId` is the primary handler (used to gate actions). */
export function isPrimaryHandler(
  assignments: TicketAssignmentDTO[] | undefined | null,
  userId: string | null | undefined,
): boolean {
  return !!userId && getPrimaryHandlerId(assignments) === userId;
}
