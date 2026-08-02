import type {
  EscalationReasonEnum,
  TicketStatusEnum,
  PauseReasonEnum,
  MaintenanceLogTypeEnum,
  MaintenanceLogDTO,
  CommentAttachmentPayload,
  ChatMentionInput,
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
  /** BE nhận mention qua field này, KHÔNG parse '@' từ body. */
  mentions?: ChatMentionInput[];
  attachments?: CommentAttachmentPayload[];
}

// ── GH-67 — Staff dashboard KPI snapshot ──────────────────────────────────
// GET /api/staff/tickets/dashboard/stats → CommonResponse<StaffTicketDashboardStatsDto>.
// Verify khớp BE StaffTicketDashboardStatsDto.cs + web dashboardStats.types.ts §B.
// Scope tự động theo assignedStaffId từ JWT; không nhận query param. FE cache ~60s.

export interface SlaSummaryDto {
  met: number;
  breached: number;
  running: number;
  paused: number;
  /** Met / (Met + Breached) × 100; = 100 khi chưa có timer kết thúc. */
  compliancePercent: number;
}

export interface SlaRiskDto {
  healthy: number;
  near: number;
  breached: number;
}

/** 1 điểm trend theo ngày (bucket UTC), ngày trống = 0. */
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
  /** Đủ 14 status (BE zero-fill); FE vẫn default `?? 0` khi đọc. */
  countByStatus: Record<string, number>;
  slaRisk: SlaRiskDto;
  createdTrend7Days: DailyCountPointDto[]; // đúng 7 điểm
}
