// GH-83 — enum riêng của ticket chat (string-based, khác các enum int bên dưới).
// Đặt ở dòng đầu file: import nằm sau `export ... from` sẽ dính eslint `import/first`.
import type { VoiceTranscriptionStatusEnum } from '../enums/chat.enum';

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
  ParticipantTypeEnum,
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
  ParticipantTypeEnum,
} from '../../../shared/enums/ticket.enum';

// GH-83 — enum riêng của ticket chat (string-based, khác các enum int ở trên).
// Đặt SAU khối import: `export ... from` xen giữa các import làm eslint `import/first` kêu.
export { VoiceTranscriptionStatusEnum } from '../enums/chat.enum';

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
  /** GH-866 — mention nằm trong chat nội bộ. Chọn view public/internal, KHÔNG phải authz. */
  isInternal: boolean;
  createdAt: string;
}

export interface TicketParticipantDTO {
  id: string;
  ticketId: string;
  userId: string;
  /** BE resolve từ CustomerAccounts/StaffAccounts; fallback userId nếu không thấy. */
  displayName: string;
  userRole: ActorRoleEnum;
  /** Serialize dạng chuỗi ('Owner' | 'PrimaryAssignee' | ...), KHÔNG phải số. */
  participantType: ParticipantTypeEnum;
  canPost: boolean;
  canViewInternal: boolean;
  addedByUserId: string;
  addedAt: string;
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
  /**
   * GH-83 — trạng thái chuyển giọng nói → văn bản (chỉ có ở chat voice).
   *
   * ⚠️ TicketService bật `JsonStringEnumConverter` nên BE trả **CHUỖI** (`"Failed"`), không phải số.
   * `null`/`undefined` = chat thường, không phải voice.
   */
  voiceTranscriptionStatus?: VoiceTranscriptionStatusEnum | null;
}

/**
 * #697 — 1 ticket có 1 PrimaryHandler + N Supporter.
 * BE chỉ trả `staffId` (UUID), KHÔNG có tên: Customer không được phép đọc danh
 * sách nhân sự nên đừng cố map ra tên ở app khách hàng.
 */
export type TicketAssignmentRole = 'PrimaryHandler' | 'Supporter';

export interface TicketAssignmentDTO {
  staffId: string;
  role: TicketAssignmentRole;
}

export interface TicketDTO {
  id: string;
  code: string;
  batteryAssetId: string | null;
  customerId: string;
  customerName?: string | null;
  /**
   * #697 — THAY cho `assignedStaffId`/`assignedStaffName` (BE đã bỏ hẳn; đọc 2
   * field cũ luôn ra undefined nên card "Kỹ thuật viên" hiện sai "Chưa phân công").
   */
  assignments: TicketAssignmentDTO[];
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
  /** BE tính sẵn theo user hiện tại (TicketQueryHelper) — có chat chưa đọc trên ticket này. */
  hasUnreadChat: boolean;
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
  /** Thời điểm Customer phát hiện pin bất thường (Customer nhập khi tạo ticket). */
  detectedAt: string | null;
  /** Serial pin snapshot (BE denormalize) — hiển thị nếu không load được battery. */
  batterySerialNumber: string | null;
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
  /**
   * BE required: ít nhất 1 pin, không rỗng, không trùng lặp
   * (khớp TicketCreateCommand.BatteryAssetIds).
   */
  batteryAssetIds: string[];
  /**
   * GH-866 — MỘT mốc thời gian Customer phát hiện sự cố (ISO UTC), thay cho cặp
   * from/to cũ. BE required và reject nếu ở tương lai.
   */
  incidentDetectedAt: string;
  attachments?: TicketAttachmentPayload[];
}

export interface UploadedTicketAttachment {
  uri: string;
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** publicUrl từ FileUploadResponse — BE ticket create bắt buộc có url. */
  url: string;
}

/**
 * Attachment gửi kèm khi TẠO ticket (POST /api/customer/tickets).
 * Khác CommentAttachmentPayload: BE `TicketAttachmentInput` bắt buộc thêm `url`
 * (required, tối đa 2000 ký tự) — thiếu sẽ bị 400.
 */
export interface TicketAttachmentPayload {
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
}

export interface CommentAttachmentPayload {
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Mention gửi kèm chat — BE nhận qua field `mentions`, KHÔNG parse '@' từ body.
 * Không gửi field này thì mention không được tạo dù text có '@Tên'.
 */
export interface ChatMentionInput {
  userId: string;
  displayName: string;
}

export interface AddCommentPayload {
  body: string;
  isInternal: false;
  mentions?: ChatMentionInput[];
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
