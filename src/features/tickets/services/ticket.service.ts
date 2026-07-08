import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { CommonResponse, PaginationResponse } from '../../../types/api.types';
import {
  AddCommentPayload,
  CommentListParams,
  CreateTicketPayload,
  RatePayload,
  ReopenPayload,
  TicketActionResponse,
  TicketActivityDTO,
  TicketCommentDTO,
  TicketDetailDTO,
  TicketDTO,
  TicketListParams,
} from '../types/ticket.types';

const { TICKETS } = ENDPOINTS;

export const ticketService = {
  getList: (params?: TicketListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketDTO>>>(TICKETS.CUSTOMER_LIST, { params }),

  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<TicketDetailDTO>>(TICKETS.DETAIL(id)),

  create: (data: CreateTicketPayload) =>
    axiosInstance.post<TicketActionResponse>(TICKETS.CUSTOMER_CREATE, data),

  getComments: (ticketId: string, params?: CommentListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketCommentDTO>>>(
      TICKETS.CHATS(ticketId),
      { params },
    ),

  getActivities: (ticketId: string) =>
    axiosInstance.get<CommonResponse<TicketActivityDTO[]>>(TICKETS.ACTIVITIES(ticketId)),

  addComment: (ticketId: string, data: AddCommentPayload) =>
    axiosInstance.post<TicketActionResponse>(TICKETS.CHATS(ticketId), data),

  reopen: (id: string, data: ReopenPayload) =>
    axiosInstance.post<TicketActionResponse>(TICKETS.REOPEN(id), data),

  rate: (id: string, data: RatePayload) =>
    axiosInstance.post<TicketActionResponse>(TICKETS.RATE(id), data),
};
