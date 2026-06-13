export {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
  TicketOriginEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  EscalationReasonEnum,
  SlaTimerStatusEnum,
  ActorRoleEnum,
  ActivityActionEnum,
} from '../../../shared/enums/ticket.enum';

import type {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
  TicketOriginEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  EscalationReasonEnum,
  SlaTimerStatusEnum,
  ActorRoleEnum,
  ActivityActionEnum,
} from '../../../shared/enums/ticket.enum';

export interface SlaTimerDTO {
  id: string;
  priority: TicketPriorityEnum;
  startedAt: string;
  dueAt: string;
  originalDueAt: string;
  totalPausedMinutes: number;
  warningSentAt: string | null;
  breachAt: string | null;
  status: SlaTimerStatusEnum;
  remainingPercent: number;
}

export interface TicketActivityDTO {
  id: string;
  ticketId: string;
  actorUserId: string | null;
  actorRole: ActorRoleEnum;
  actorDisplayName: string | null;
  action: ActivityActionEnum;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  createdAt: string;
}

export interface TicketCommentDTO {
  id: string;
  ticketId: string;
  authorUserId: string | null;
  authorRole: ActorRoleEnum;
  authorDisplayName: string | null;
  body: string;
  isInternal: boolean;
  attachmentFileIds: string[] | null;
  createdAt: string;
}

export interface TicketDTO {
  id: string;
  code: string;
  batteryAssetId: string | null;
  customerId: string;
  assignedStaffId: string | null;
  assignedStaffName?: string | null;
  title: string;
  category: TicketCategoryEnum;
  priority: TicketPriorityEnum;
  impactScope: ImpactScopeEnum;
  urgencyLevel: UrgencyLevelEnum;
  status: TicketStatusEnum;
  origin: TicketOriginEnum;
  reopenCount: number;
  isIncident: boolean;
  createdAt: string;
  updatedAt: string | null;
  slaTimer: SlaTimerDTO | null;
}

export interface TicketDetailDTO extends TicketDTO {
  description: string | null;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  resolvedByStaffId: string | null;
  approvedAt: string | null;
  approvedByManagerId: string | null;
  rejectionReason: string | null;
  closedAt: string | null;
  rating: number | null;
  ratingComment: string | null;
  ratedAt: string | null;
  escalatedAt: string | null;
  escalationReason: EscalationReasonEnum | null;
  originAlertId: string | null;
  activities: TicketActivityDTO[] | null;
  comments: TicketCommentDTO[] | null;
  maintenanceLogs: unknown[] | null;
  attachments: TicketAttachmentDTO[] | null;
}

export interface TicketAttachmentDTO {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  uploadedAt: string | null;
}

export interface TicketActionDto {
  id: string | null;
  code: string | null;
  status: TicketStatusEnum;
}

export interface TicketActionResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  data: TicketActionDto | null;
  listErrors: { field: string | null; detail: string | null }[] | null;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  category: TicketCategoryEnum;
  batteryAssetId?: string;
  attachmentFileIds?: string[];
}

export interface UploadedTicketAttachment {
  uri: string;
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface CommentAttachmentPayload {
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface AddCommentPayload {
  body: string;
  isInternal: false;
  attachments?: CommentAttachmentPayload[];
}

export interface RatePayload {
  rating: number;
  ratingComment?: string;
}

export interface ReopenPayload {
  reopenReason?: string;
}

export interface TicketListParams {
  Status?: TicketStatusEnum;
  PageNumber?: number;
  PageSize?: number;
}
