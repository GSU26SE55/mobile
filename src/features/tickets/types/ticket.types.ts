export type TicketStatusEnum =
  | 'New' | 'Open' | 'Approved' | 'Assigned' | 'InProgress'
  | 'WaitingCustomer' | 'WaitingParts' | 'WaitingOnsiteSchedule'
  | 'Resolved' | 'Escalated' | 'ClosedPendingRate' | 'Closed'
  | 'ClosedRejected' | 'Incident';

export type TicketPriorityEnum = 'P1Critical' | 'P2High' | 'P3Normal';

export type TicketCategoryEnum =
  | 'Charging' | 'Overheat' | 'NoPower' | 'Performance' | 'Repair' | 'Other';

export type TicketOriginEnum = 'ManualByCustomer' | 'AutoFromAlert' | 'CreatedByStaff';

export type ImpactScopeEnum = 'SingleAsset' | 'Site' | 'MultiSite';

export type UrgencyLevelEnum = 'Low' | 'Medium' | 'High';

export type EscalationReasonEnum =
  | 'SkillGap' | 'PartsRequired' | 'SafetyConcern' | 'SlaBreach' | 'CustomerComplaint';

export type SlaTimerStatusEnum = 'Running' | 'Paused' | 'Met' | 'Breached';

export type ActorRoleEnum = 'Admin' | 'Manager' | 'Staff' | 'Customer' | 'System';

export type ActivityActionEnum =
  | 'Created' | 'StatusChanged' | 'PriorityAssigned' | 'StaffAssigned'
  | 'StaffReassigned' | 'Commented' | 'MaintenanceLogged' | 'AttachmentAdded'
  | 'SlaPaused' | 'SlaResumed' | 'SlaWarning' | 'SlaBreached'
  | 'EscalationRequested' | 'Escalated' | 'IncidentDeclared' | 'Resolved'
  | 'Approved' | 'Rejected' | 'Rated' | 'Reopened' | 'AutoClosed'
  | 'ResolvedByEscalatedStaff' | 'TriageApproved';

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
  slaTimer: SlaTimerDTO;
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
  attachments: unknown[] | null;
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
}

export interface AddCommentPayload {
  body: string;
  isInternal: false;
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
