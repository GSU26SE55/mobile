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

/** `userId` có phải Primary Handler của ticket không (dùng gate quyền thao tác). */
export function isPrimaryHandler(
  assignments: TicketAssignmentDTO[] | undefined | null,
  userId: string | null | undefined,
): boolean {
  return !!userId && getPrimaryHandlerId(assignments) === userId;
}
