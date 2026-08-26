import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateTicketLifecycle } from '../utils/invalidateTicketLifecycle';
import { ticketService } from '../services/ticket.service';
import { SchedulePeriodicMaintenancePayload } from '../types/ticket.types';

/**
 * Khách chốt giờ cho chuyến bảo trì định kỳ.
 *
 * Sau khi chốt, worker nhắc lịch bên TicketService ngừng nhắc ticket này — nó chỉ lấy ticket
 * có `scheduledStartAtUtc` còn trống. Nên phải làm mới cache ngay, nếu không màn hình vẫn
 * hiện ô chọn giờ cho một ticket đã chốt.
 */
export function useSchedulePeriodicMaintenance(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SchedulePeriodicMaintenancePayload) =>
      ticketService.schedulePeriodicMaintenance(ticketId, data),
    onSuccess: () => {
      invalidateTicketLifecycle(queryClient, ticketId);
    },
  });
}
