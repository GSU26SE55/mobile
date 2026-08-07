// #697 — đọc phân công Staff trên ticket (thay `assignedStaffId` BE đã bỏ).
// BE chỉ trả staffId (UUID), KHÔNG kèm tên.

import { TicketAssignmentDTO } from '../types/ticket.types';

/** Staff chịu trách nhiệm chính — null khi ticket chưa được gán. */
export function getPrimaryHandlerId(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string | null {
  return assignments?.find((a) => a.role === 'PrimaryHandler')?.staffId ?? null;
}

/** Số Staff hỗ trợ (Supporter) — không tính vào workload. */
export function countSupporters(
  assignments: TicketAssignmentDTO[] | undefined | null,
): number {
  return assignments?.filter((a) => a.role === 'Supporter').length ?? 0;
}

/**
 * Tên hiển thị của 1 dòng phân công. BE trả sẵn `staffName` (từ StaffAccount đã
 * sync) nên mọi role đọc được — không cần gọi /api/staff (chỉ Admin/Manager).
 * Chưa sync kịp thì fallback staffId để còn định danh được.
 */
export function assignmentDisplayName(a: TicketAssignmentDTO): string {
  return a.staffName?.trim() || a.staffId;
}

/** Tên Primary Handler — null khi chưa gán. */
export function getPrimaryHandlerName(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string | null {
  const primary = assignments?.find((a) => a.role === 'PrimaryHandler');
  return primary ? assignmentDisplayName(primary) : null;
}

/** Tên các Staff hỗ trợ. */
export function getSupporterNames(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string[] {
  return (assignments ?? [])
    .filter((a) => a.role === 'Supporter')
    .map(assignmentDisplayName);
}

/**
 * Chuỗi gọn cho card DANH SÁCH — cố tình KHÔNG liệt kê tên khi có nhiều người:
 * - 0 người  → "Chưa phân công"
 * - 1 người  → "Nguyễn Văn A"          (1 người thì hiện thẳng tên)
 * - 2+ người → "3 người phụ trách"     (ghép tên vào card hẹp là tràn/xuống dòng xấu)
 *
 * Tên đầy đủ của từng người hiện ở màn CHI TIẾT ticket, không nhồi vào card.
 */
export function assignmentSummary(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string {
  const primary = getPrimaryHandlerName(assignments);
  const names = [...(primary ? [primary] : []), ...getSupporterNames(assignments)];
  if (names.length === 0) return 'Chưa phân công';
  if (names.length === 1) return names[0];
  return `${names.length} người phụ trách`;
}

/** `userId` có phải Primary Handler của ticket không (dùng gate quyền thao tác). */
export function isPrimaryHandler(
  assignments: TicketAssignmentDTO[] | undefined | null,
  userId: string | null | undefined,
): boolean {
  return !!userId && getPrimaryHandlerId(assignments) === userId;
}
