import type {
  EscalationReasonEnum,
  TicketStatusEnum,
  PauseReasonEnum,
  MaintenanceLogTypeEnum,
  MaintenanceLogDTO,
  CommentAttachmentPayload,
  ChatMentionInput,
} from '@/src/features/tickets/types/ticket.types';
import type { StaffSkillTierEnum } from '../enums/staff.enum';

export { StaffSkillTierEnum } from '../enums/staff.enum';

export interface StaffProfileDTO {
  accountId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  // TODO(BE): getProfile() currently doesn't return skillTier & currentTicketCount — left null, UI hides it instead of showing a fake value.
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
  note: string;
  rescheduledStartAt: string;
}

export interface ResumePayload { reason: string; }

export interface ResolvePayload {
  // BE required (TicketResolveCommand) — empty → 400.
  resolutionSummary: string;
}

export interface EscalatePayload {
  reason: EscalationReasonEnum;
  note: string;
}

export interface MaintenanceLogPayload {
  logType?: MaintenanceLogTypeEnum;
  summary: string;
  diagnosisDetails?: string;
  actionsTaken?: string;
  durationMinutes?: number;
  // BE required (MaintenanceLogAddCommand.ValidateAsync) — missing/default → 400 "Invalid start time."
  startedAt: string;
  // Null = log is "in progress"; BE returns 409 if the ticket already has an incomplete log. The mobile form records finished work → always sent.
  completedAt?: string;
  resolutionNote?: string;
  partsUsed?: string;
  beforePhotos?: CommentAttachmentPayload[];
  afterPhotos?: CommentAttachmentPayload[];
}

// GH-44 #4 — PATCH /tickets/{ticketId}/maintenance-logs/{logId}. All fields optional (partial update).
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

// GH-44 #3 — GET /staff/tickets/maintenance-logs/me → logs grouped by ticket.
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

// Staff is allowed to post internal comments (isInternal=true) — unlike customer (always false).
export interface StaffAddCommentPayload {
  body: string;
  isInternal?: boolean;
  /** BE nhận mention qua field này, KHÔNG parse '@' từ body. */
  mentions?: ChatMentionInput[];
  attachments?: CommentAttachmentPayload[];
}

// ── GH-67 — Staff dashboard KPI snapshot ──────────────────────────────────
// GET /api/staff/tickets/dashboard/stats → CommonResponse<StaffTicketDashboardStatsDto>.
// Verified to match BE StaffTicketDashboardStatsDto.cs + web dashboardStats.types.ts §B.
// Scoped automatically by assignedStaffId from JWT; no query params accepted. FE caches ~60s.

export interface SlaSummaryDto {
  met: number;
  breached: number;
  running: number;
  paused: number;
  /** Met / (Met + Breached) × 100; = 100 when no timer has ended yet. */
  compliancePercent: number;
}

export interface SlaRiskDto {
  healthy: number;
  near: number;
  breached: number;
}

/** 1 trend point per day (UTC bucket), empty day = 0. */
export interface DailyCountPointDto {
  date: string; // "yyyy-MM-dd"
  count: number;
}

export interface StaffTicketDashboardStatsDto {
  openCount: number;
  resolvedCount: number;
  nearBreachCount: number;
  breachedCount: number;
  pausedCount: number;
  slaMonitoredCount: number;
  sla: SlaSummaryDto;
  /** All 14 statuses present (BE zero-fills); FE still defaults `?? 0` when reading. */
  countByStatus: Record<string, number>;
  slaRisk: SlaRiskDto;
  createdTrend7Days: DailyCountPointDto[]; // exactly 7 points
}
