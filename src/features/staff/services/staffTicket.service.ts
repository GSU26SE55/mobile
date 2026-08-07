import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import { TicketActionResponse, TicketDetailDTO, TicketDTO } from '@/src/features/tickets/types/ticket.types';
import { EscalatePayload, HoldPayload, MaintenanceLogPayload, ResolvePayload, StaffAddCommentPayload, StaffMaintenanceLogGroupDTO, StaffTicketDashboardStatsDto, StaffTicketListParams, UpdateMaintenanceLogPayload } from '../types/staff.types';

const { STAFF_TICKETS, TICKETS } = ENDPOINTS;

export const staffTicketService = {
  getMyTickets: (params?: StaffTicketListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketDTO>>>(STAFF_TICKETS.MY_LIST, { params }),

  // GH-67 — KPI snapshot theo JWT (không query param).
  getDashboardStats: () =>
    axiosInstance.get<CommonResponse<StaffTicketDashboardStatsDto>>(STAFF_TICKETS.DASHBOARD_STATS),

  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<TicketDetailDTO>>(TICKETS.DETAIL(id)),

  start: (id: string) =>
    axiosInstance.post<TicketActionResponse>(STAFF_TICKETS.START(id)),

  hold: (id: string, data: HoldPayload) =>
    axiosInstance.post<TicketActionResponse>(STAFF_TICKETS.HOLD(id), data),

  resume: (id: string) =>
    axiosInstance.post<TicketActionResponse>(STAFF_TICKETS.RESUME(id)),

  resolve: (id: string, data: ResolvePayload) =>
    axiosInstance.post<TicketActionResponse>(STAFF_TICKETS.RESOLVE(id), data),

  escalateRequest: (id: string, data: EscalatePayload) =>
    axiosInstance.post<TicketActionResponse>(STAFF_TICKETS.ESCALATE_REQUEST(id), data),

  addComment: (ticketId: string, data: StaffAddCommentPayload) =>
    axiosInstance.post<TicketActionResponse>(TICKETS.CHATS(ticketId), data),

  addMaintenanceLog: (ticketId: string, data: MaintenanceLogPayload) =>
    axiosInstance.post<TicketActionResponse>(STAFF_TICKETS.MAINTENANCE_LOG(ticketId), data),

  getMyMaintenanceLogs: () =>
    axiosInstance.get<CommonResponse<StaffMaintenanceLogGroupDTO[]>>(STAFF_TICKETS.MY_MAINTENANCE_LOGS),

  updateMaintenanceLog: (ticketId: string, logId: string, data: UpdateMaintenanceLogPayload) =>
    axiosInstance.patch<TicketActionResponse>(STAFF_TICKETS.MAINTENANCE_LOG_ITEM(ticketId, logId), data),
};
