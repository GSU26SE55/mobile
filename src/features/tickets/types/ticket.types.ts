// GH-83 — ticket chat's own enum (string-based, unlike the int enums below).
// Placed at the top of the file: an import after `export ... from` would trigger eslint `import/first`.
import type { VoiceTranscriptionStatusEnum } from '../enums/chat.enum';

export {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
  TicketOriginEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  PauseReasonEnum,
  PendingContextEnum,
  EscalationReasonEnum,
  SlaTimerStatusEnum,
  MaintenanceLogTypeEnum,
  ActorRoleEnum,
  ActivityActionEnum,
  ReactionTypeEnum,
  ParticipantTypeEnum,
  TicketVerifyStatusEnum,
  TicketCloseReasonEnum,
} from '@/src/shared/enums/ticket.enum';

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
  TicketVerifyStatusEnum,
  TicketCloseReasonEnum,
  PendingContextEnum,
  PauseReasonEnum,
} from '@/src/shared/enums/ticket.enum';

// GH-83 — ticket chat's own enum (string-based, unlike the int enums above).
// Placed AFTER the import block: `export ... from` interleaved among imports triggers eslint `import/first`.
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

// GH-68 — reaction aggregate (BE TicketChatReactionsAggregateDTO). Each group has a count +
// list of users who reacted (used to know which type the current user reacted with → toggle).
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

// GH-68 — mention within a chat (BE TicketChatMentionDTO).
export interface TicketChatMentionDTO {
  id: string;
  chatId: string;
  ticketId: string | null;
  mentionedUserId: string;
  mentionedUserRole: ActorRoleEnum;
  mentionedDisplayName: string | null;
  /** GH-866 — mention within an internal chat. Selects public/internal view, NOT authz. */
  isInternal: boolean;
  createdAt: string;
}

export interface TicketParticipantDTO {
  id: string;
  ticketId: string;
  userId: string;
  /** BE resolves from CustomerAccounts/StaffAccounts; falls back to userId if not found. */
  displayName: string;
  userRole: ActorRoleEnum;
  /** Serialized as a string ('Owner' | 'PrimaryAssignee' | ...), NOT a number. */
  participantType: ParticipantTypeEnum;
  canPost: boolean;
  canViewInternal: boolean;
  addedByUserId: string;
  addedAt: string;
}

// GH-68 — full attachment (only populated on GetById; the list uses attachmentFileIds).
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
  // GH-67 — pinned chat. BE GET /chats list (TicketChatsQueryHandler) projects all 3; realtime
  // ChatAdded doesn't include them → optional, undefined = not pinned.
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinnedByUserId?: string | null;
  /**
   * Whether the current user has read this message. BE sets it on GET /chats (list + cursor);
   * messages sent by the user themself are always true. Realtime ChatAdded does NOT include it →
   * undefined means "unknown", don't treat undefined as unread (it would misdraw the
   * "unread messages" marker).
   */
  isRead?: boolean;
  // GH-68 — the cursor/list handler BE populates it fully; realtime ChatAdded doesn't → optional.
  bodyFormat?: string;
  bodyHtml?: string | null;
  editedAt?: string | null;
  lastEditedByUserId?: string | null;
  reactions?: TicketChatReactionsAggregateDTO;
  mentions?: TicketChatMentionDTO[];
  attachments?: TicketAttachmentDTO[] | null;
  /**
   * GH-83 — voice-to-text conversion status (only present for voice chats).
   *
   * Warning: TicketService has `JsonStringEnumConverter` enabled so BE returns a **STRING**
   * (`"Failed"`), not a number. `null`/`undefined` = a regular chat, not voice.
   */
  voiceTranscriptionStatus?: VoiceTranscriptionStatusEnum | null;
}

/**
 * #697 — 1 ticket has 1 PrimaryHandler + N Supporters.
 * BE only returns `staffId` (UUID), NO name: Customers aren't allowed to read the
 * staff directory, so don't try to map it to a name in the customer app.
 */
export type TicketAssignmentRole = 'PrimaryHandler' | 'Supporter' | 'PreviousPrimaryHandler';

export interface TicketAssignmentDTO {
  staffId: string;
  role: TicketAssignmentRole;
  /**
   * Staff name — BE gets it from StaffAccount synced into TicketService.
   * Null when sync hasn't caught up yet → falls back to displaying staffId.
   */
  staffName?: string | null;
}

export interface TicketDTO {
  id: string;
  code: string;
  /** Legacy — first battery. BE returns `""` (not null) when the ticket has no battery attached. */
  batteryAssetId: string | null;
  /** Full list of battery IDs — the correct source per GH-866 (a ticket supports multiple batteries). */
  batteryAssetIds: string[];
  customerId: string;
  customerName?: string | null;
  /**
   * #697 — REPLACES `assignedStaffId`/`assignedStaffName` (BE removed them entirely; reading
   * the 2 old fields always yields undefined, causing the "Technician" card to incorrectly
   * show "Not assigned").
   */
  assignments: TicketAssignmentDTO[];
  title: string;
  category: TicketCategoryEnum;
  // BE returns null when the ticket hasn't been triaged yet (state New/Open) — assigned at triage.
  priority: TicketPriorityEnum | null;
  impactScope: ImpactScopeEnum | null;
  urgencyLevel: UrgencyLevelEnum | null;
  status: TicketStatusEnum;
  origin: TicketOriginEnum;
  reopenCount: number;
  isIncident: boolean;
  /**
   * Environmental incident (smoke, gas leak, flooding) this ticket was auto-created from.
   * Null on every other ticket.
   *
   * Its presence is what marks a ticket as *site-level*: the fault is in the cabinet, not in one
   * battery, so `batteryAssetId` is empty by design. Without it the UI cannot tell "no battery
   * attached" apart from "battery still loading", and shows a battery card reading
   * "No device linked" — which looks like broken data instead of a field that does not apply.
   */
  environmentalIncidentId?: string | null;
  scheduledStartAtUtc: string | null;
  scheduleVersion: number;
  pendingContext: PendingContextEnum | null;
  pendingReason: PauseReasonEnum | null;
  activeIncidentEpisodeId: string | null;
  /** Pre-computed by BE for the current user (TicketQueryHelper) — has unread chat on this ticket. */
  hasUnreadChat: boolean;
  createdAt: string;
  updatedAt: string | null;
  slaTimer: SlaTimerDTO | null;

  // ── BE returns these on BOTH list and detail (docs list them under TicketDTO) ──
  /** When the Customer declared the incident was detected (`incidentDetectedAt` at creation). */
  detectedAt: string | null;
  /** Battery serial snapshot at ticket creation — displayable without an extra API call. */
  batterySerialNumber: string | null;
  /** AI verification status of ticket validity. */
  aiVerifyStatus: TicketVerifyStatusEnum;
  aiVerifyScore: number | null;
  aiVerifyReason: string | null;
  suspectedDuplicateOfTicketId: string | null;
  duplicateReason: string | null;
  /** Non-null ⇒ the ticket was merged into another ticket, closed and hidden from the queue. */
  mergedIntoTicketId: string | null;
  closeReason: TicketCloseReasonEnum | null;
}

export interface MaintenanceLogDTO {
  id: string;
  // BE MaintenanceLogDTO does NOT return ticketId (see MaintenanceLogsByTicketQueryHandler) — don't redeclare it.
  staffId: string;
  logType: MaintenanceLogTypeEnum;
  summary: string | null;
  diagnosisDetails: string | null;
  actionsTaken: string | null;
  durationMinutes: number;
  resolutionNote: string | null;
  partsUsed: string | null;
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
  /**
   * BE returns `chats` (TicketChatDTO[]) — `comments` no longer exists.
   * `TicketCommentsController` has been removed; TicketCommentDTO in this file is
   * actually the shape of TicketChatDTO (kept the old name to avoid changing every call site).
   */
  chats: TicketCommentDTO[] | null;
  maintenanceLogs: MaintenanceLogDTO[] | null;
  // BE returns an array of FileId (string[]), NOT an array of TicketAttachmentDTO.
  attachmentFileIds: string[] | null;
}

export interface TicketActionDto {
  id: string;
  ticketId?: string;
  code: string;
  status: TicketStatusEnum;
  warnings?: string[];
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
   * BE required: at least 1 battery, non-empty, no duplicates
   * (matches TicketCreateCommand.BatteryAssetIds).
   */
  batteryAssetIds: string[];
  /**
   * GH-866 — A SINGLE timestamp for when the Customer detected the incident (ISO UTC),
   * replacing the old from/to pair. BE requires it and rejects it if in the future.
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
  /** publicUrl from FileUploadResponse — BE ticket create requires a url. */
  url: string;
}

/**
 * Attachment sent along when CREATING a ticket (POST /api/customer/tickets).
 * Differs from CommentAttachmentPayload: BE `TicketAttachmentInput` additionally requires
 * `url` (required, max 2000 characters) — missing it results in a 400.
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
 * Mention sent along with a chat — BE receives it via the `mentions` field, does NOT
 * parse '@' from the body. Without sending this field, no mention is created even if
 * the text contains '@Name'.
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
  reopenReason: string;
}


export interface TicketListParams {
  Status?: TicketStatusEnum;
  PageNumber?: number;
  PageSize?: number;
}

// GH-44 #1 — GET /tickets/{id}/comments. Controller accepts params `page`/`pageSize` (lowercase).
export interface CommentListParams {
  page?: number;
  pageSize?: number;
}
