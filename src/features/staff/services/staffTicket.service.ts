import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import { AddCommentPayload, TicketActionResponse, TicketDetailDTO, TicketDTO } from '../../tickets/types/ticket.types';
import { EscalatePayload, HoldPayload, MaintenanceLogPayload, ResolvePayload, StaffTicketListParams } from '../types/staff.types';

const { STAFF_TICKETS, TICKETS } = ENDPOINTS;

export const staffTicketService = {
  getMyTickets: (params?: StaffTicketListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketDTO>>>(STAFF_TICKETS.MY_LIST, { params }),

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

  addComment: (ticketId: string, data: AddCommentPayload) =>
    axiosInstance.post<TicketActionResponse>(TICKETS.COMMENT(ticketId), data),

  addMaintenanceLog: (ticketId: string, data: MaintenanceLogPayload) =>
    axiosInstance.post<TicketActionResponse>(STAFF_TICKETS.MAINTENANCE_LOG(ticketId), data),
};
