export {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
  TicketOriginEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  PauseReasonEnum,
  EscalationReasonEnum,
  SlaTimerStatusEnum,
  MaintenanceLogTypeEnum,
  ActorRoleEnum,
  ActivityActionEnum,
  ReactionTypeEnum,
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
  MaintenanceLogTypeEnum,
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

// GH-68 — reaction aggregate (BE TicketChatReactionsAggregateDTO). Mỗi nhóm gồm count + danh
// sách user đã react (dùng để biết current user đã react loại nào → toggle).
export interface ChatReactionUserDTO {
  userId: string;
  role: ActorRoleEnum;
}
export interface ChatReactionGroupDTO {
  count: number;
  users: ChatReactionUserDTO[];
}
export interface TicketChatReactionsAggregateDTO {
  thumbsUp: ChatReactionGroupDTO;
  acknowledged: ChatReactionGroupDTO;
  resolved: ChatReactionGroupDTO;
  needMoreInfo: ChatReactionGroupDTO;
  disagree: ChatReactionGroupDTO;
}

// GH-68 — mention trong chat (BE TicketChatMentionDTO).
export interface TicketChatMentionDTO {
  id: string;
  chatId: string;
  ticketId: string | null;
  mentionedUserId: string;
  mentionedUserRole: ActorRoleEnum;
  mentionedDisplayName: string | null;
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

// GH-68 — attachment đầy đủ (chỉ điền khi GetById; list dùng attachmentFileIds).
export interface TicketAttachmentDTO {
  id: string;
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
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
  editCount?: number;
  updatedAt?: string | null;
  // GH-67 — pin chat. BE GET /chats list (TicketChatsQueryHandler) project cả 3; realtime
  // ChatAdded không kèm → optional, undefined = chưa pin.
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinnedByUserId?: string | null;
  // GH-68 — cursor/list handler BE populate đủ; realtime ChatAdded không kèm → optional.
  bodyFormat?: string;
  bodyHtml?: string | null;
  editedAt?: string | null;
  lastEditedByUserId?: string | null;
  reactions?: TicketChatReactionsAggregateDTO;
  mentions?: TicketChatMentionDTO[];
  attachments?: TicketAttachmentDTO[] | null;
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
  // BE trả null khi ticket chưa triage (state New/Open) — gán tại bước triage.
  priority: TicketPriorityEnum | null;
  impactScope: ImpactScopeEnum | null;
  urgencyLevel: UrgencyLevelEnum | null;
  status: TicketStatusEnum;
  origin: TicketOriginEnum;
  reopenCount: number;
  isIncident: boolean;
  createdAt: string;
  updatedAt: string | null;
  slaTimer: SlaTimerDTO | null;
}

export interface MaintenanceLogDTO {
  id: string;
  ticketId: string;
  staffId: string;
  logType: MaintenanceLogTypeEnum;
  summary: string | null;
  diagnosisDetails: string | null;
  actionsTaken: string | null;
  durationMinutes: number;
  resolutionNote: string | null;
  startedAt: string;
  completedAt: string | null;
  attachmentFileIds: string[] | null;
  beforePhotosFileIds: string[] | null;
  afterPhotosFileIds: string[] | null;
  relatedKbArticleIds: string[] | null;
  createdAt: string;
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
  maintenanceLogs: MaintenanceLogDTO[] | null;
  // BE trả mảng FileId (string[]), KHÔNG phải mảng TicketAttachmentDTO.
  attachmentFileIds: string[] | null;
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
  attachments?: CommentAttachmentPayload[];
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

// GH-44 #1 — GET /tickets/{id}/comments. Controller nhận param `page`/`pageSize` (lowercase).
export interface CommentListParams {
  page?: number;
  pageSize?: number;
}
