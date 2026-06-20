import type {
  EscalationReasonEnum,
  TicketStatusEnum,
  PauseReasonEnum,
  MaintenanceLogTypeEnum,
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
  skillTier: StaffSkillTierEnum;
  maxConcurrentTickets: number;
  currentTicketCount: number;
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
