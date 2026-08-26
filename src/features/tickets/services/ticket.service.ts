import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
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
  TicketParticipantDTO,
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


  getParticipants: (ticketId: string) =>
    axiosInstance.get<CommonResponse<TicketParticipantDTO[]>>(TICKETS.PARTICIPANTS(ticketId)),
};
