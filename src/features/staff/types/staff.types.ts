import type {
  EscalationReasonEnum,
  TicketStatusEnum,
  PauseReasonEnum,
  MaintenanceLogTypeEnum,
  MaintenanceLogDTO,
  CommentAttachmentPayload,
} from '../../tickets/types/ticket.types';
import type { StaffSkillTierEnum } from '../enums/staff.enum';

export { StaffSkillTierEnum } from '../enums/staff.enum';

export interface StaffProfileDTO {
  accountId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  // TODO(BE): getProfile() hiện chưa trả skillTier & currentTicketCount — để null, UI ẩn thay vì hiển thị giá trị giả.
  skillTier: StaffSkillTierEnum | null;
  maxConcurrentTickets: number;
  currentTicketCount: number | null;
  isAvailable: boolean;
  notes: string | null;
  skills: string[];
  avatarUrl: string | null;
}

export interface HoldPayload {
  reason: PauseReasonEnum;
  note?: string;
}

export interface ResolvePayload {
  // BE required (TicketResolveCommand) — rỗng → 400.
  resolutionSummary: string;
}

export interface EscalatePayload {
  reason: EscalationReasonEnum;
  note?: string;
}

export interface MaintenanceLogPayload {
  logType?: MaintenanceLogTypeEnum;
  summary: string;
  diagnosisDetails?: string;
  actionsTaken?: string;
  durationMinutes?: number;
  resolutionNote?: string;
  partsUsed?: string;
  beforePhotos?: CommentAttachmentPayload[];
  afterPhotos?: CommentAttachmentPayload[];
}

// GH-44 #4 — PATCH /tickets/{ticketId}/maintenance-logs/{logId}. Mọi field optional (partial update).
export interface UpdateMaintenanceLogPayload {
  logType?: MaintenanceLogTypeEnum;
  summary?: string;
  diagnosisDetails?: string;
  actionsTaken?: string;
  durationMinutes?: number;
  resolutionNote?: string;
  partsUsed?: string;
  attachments?: CommentAttachmentPayload[];
  beforePhotos?: CommentAttachmentPayload[];
  afterPhotos?: CommentAttachmentPayload[];
  relatedKbArticleIds?: string[];
}

// GH-44 #3 — GET /staff/tickets/maintenance-logs/me → log gom nhóm theo ticket.
export interface StaffMaintenanceLogGroupDTO {
  ticketId: string;
  ticketCode: string;
  ticketTitle: string;
  logs: MaintenanceLogDTO[];
}

export interface StaffTicketListParams {
  Status?: TicketStatusEnum;
  PageNumber?: number;
  PageSize?: number;
}

// Staff được phép comment nội bộ (isInternal=true) — khác customer (luôn false).
export interface StaffAddCommentPayload {
  body: string;
  isInternal?: boolean;
  attachments?: CommentAttachmentPayload[];
}
