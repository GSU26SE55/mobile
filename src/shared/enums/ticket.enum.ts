// GH-1176 canonical lifecycle. REST uses these exact case-sensitive names.
export const TicketStatusEnum = {
  Open: 'Open',
  Pending: 'Pending',
  InProgress: 'InProgress',
  Request: 'Request',
  ReAssign: 'ReAssign',
  Completed: 'Completed',
  Closed: 'Closed',
  ClosedRejected: 'ClosedRejected',
} as const;
export type TicketStatusEnum = (typeof TicketStatusEnum)[keyof typeof TicketStatusEnum];

export const TicketPriorityEnum = {
  P1Critical: 'P1Critical',
  P2High: 'P2High',
  P3Normal: 'P3Normal',
  Urgent: 'Urgent',
} as const;
export type TicketPriorityEnum = (typeof TicketPriorityEnum)[keyof typeof TicketPriorityEnum];

export const TicketCategoryEnum = {
  Charging: 'Charging',
  Overheat: 'Overheat',
  NoPower: 'NoPower',
  Performance: 'Performance',
  Repair: 'Repair',
  Other: 'Other',
} as const;
export type TicketCategoryEnum = (typeof TicketCategoryEnum)[keyof typeof TicketCategoryEnum];

export const TicketOriginEnum = {
  ManualByCustomer: 'ManualByCustomer',
  AutoFromAlert: 'AutoFromAlert',
  // Sự cố môi trường của site — origin riêng, không dùng ké AutoFromAlert/System nữa.
  AutoFromEnvironment: 'AutoFromEnvironment',
  CreatedByStaff: 'CreatedByStaff',
  // Sprint Bonus NS-13/NS-22 — auto-created by the system (cascade risk High, environmental incident Critical).
  // JsonStringEnumConverter → wire value is the STRING 'System'; int 4 in docs/api-ticket.md:168 is cross-service BE↔BE.
  System: 'System',
} as const;
export type TicketOriginEnum = (typeof TicketOriginEnum)[keyof typeof TicketOriginEnum];

export const ImpactScopeEnum = {
  SingleAsset: 'SingleAsset',
  Site: 'Site',
  MultiSite: 'MultiSite',
} as const;
export type ImpactScopeEnum = (typeof ImpactScopeEnum)[keyof typeof ImpactScopeEnum];

export const UrgencyLevelEnum = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
} as const;
export type UrgencyLevelEnum = (typeof UrgencyLevelEnum)[keyof typeof UrgencyLevelEnum];

export const PauseReasonEnum = {
  CustomerUnavailable: 'CustomerUnavailable',
  WorkBlocked: 'WorkBlocked',
} as const;
export type PauseReasonEnum = (typeof PauseReasonEnum)[keyof typeof PauseReasonEnum];

export const PendingContextEnum = {
  Scheduled: 'Scheduled',
  Held: 'Held',
} as const;
export type PendingContextEnum = (typeof PendingContextEnum)[keyof typeof PendingContextEnum];

export const MaintenanceLogTypeEnum = {
  RemoteSupport: 'RemoteSupport',
  OnSite: 'OnSite',
  PartReplacement: 'PartReplacement',
  Inspection: 'Inspection',
  // Log auto-created when Staff completes a ticket — distinct from logs written mid-work.
  Completion: 'Completion',
} as const;
export type MaintenanceLogTypeEnum = (typeof MaintenanceLogTypeEnum)[keyof typeof MaintenanceLogTypeEnum];

export const EscalationReasonEnum = {
  SkillGap: 'SkillGap',
  PartsRequired: 'PartsRequired',
  SafetyConcern: 'SafetyConcern',
  SlaBreach: 'SlaBreach',
  CustomerComplaint: 'CustomerComplaint',
} as const;
export type EscalationReasonEnum = (typeof EscalationReasonEnum)[keyof typeof EscalationReasonEnum];

export const SlaTimerStatusEnum = {
  Running: 'Running',
  Paused: 'Paused',
  Met: 'Met',
  Breached: 'Breached',
  Stopped: 'Stopped',
} as const;
export type SlaTimerStatusEnum = (typeof SlaTimerStatusEnum)[keyof typeof SlaTimerStatusEnum];

export const ActorRoleEnum = {
  Admin: 'Admin',
  Manager: 'Manager',
  Staff: 'Staff',
  Customer: 'Customer',
  System: 'System',
} as const;
export type ActorRoleEnum = (typeof ActorRoleEnum)[keyof typeof ActorRoleEnum];

// Ticket participant role — GET /api/tickets/{id}/participants.
export const ParticipantTypeEnum = {
  Owner: 'Owner',
  PrimaryAssignee: 'PrimaryAssignee',
  Collaborator: 'Collaborator',
  Watcher: 'Watcher',
  Delegate: 'Delegate',
  PreviousAssignee: 'PreviousAssignee',
} as const;
export type ParticipantTypeEnum =
  (typeof ParticipantTypeEnum)[keyof typeof ParticipantTypeEnum];

// Khớp 1-1 với BE ActivityActionEnum (TicketService trả enum dạng string).
// Trước đây có 3 tên tự chế (Commented/AutoClosed/TriageApproved) không tồn tại ở BE —
// `Commented` thực chất là `Chatted` — và thiếu 11 giá trị thật, nên timeline nhận
// những action đó thì không khớp nhánh nào.
export const ActivityActionEnum = {
  Created: 'Created',
  StatusChanged: 'StatusChanged',
  PriorityAssigned: 'PriorityAssigned',
  StaffAssigned: 'StaffAssigned',
  StaffReassigned: 'StaffReassigned',
  Chatted: 'Chatted',
  MaintenanceLogged: 'MaintenanceLogged',
  AttachmentAdded: 'AttachmentAdded',
  SlaPaused: 'SlaPaused',
  SlaResumed: 'SlaResumed',
  SlaWarning: 'SlaWarning',
  SlaBreached: 'SlaBreached',
  EscalationRequested: 'EscalationRequested',
  Escalated: 'Escalated',
  IncidentDeclared: 'IncidentDeclared',
  Resolved: 'Resolved',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Rated: 'Rated',
  Reopened: 'Reopened',
  ResolvedByEscalatedStaff: 'ResolvedByEscalatedStaff',
  Closed: 'Closed',
  ChatEdited: 'ChatEdited',
  ChatDeleted: 'ChatDeleted',
  ChatRestored: 'ChatRestored',
  ChatReplied: 'ChatReplied',
  ChatPinned: 'ChatPinned',
  ChatUnpinned: 'ChatUnpinned',
  ChatFlagged: 'ChatFlagged',
  RatingRequested: 'RatingRequested',
  ParticipantAdded: 'ParticipantAdded',
  ParticipantRemoved: 'ParticipantRemoved',
  ParticipantRoleChanged: 'ParticipantRoleChanged',
  IncidentDeclassified: 'IncidentDeclassified',
  PeriodicMaintenanceScheduleChanged: 'PeriodicMaintenanceScheduleChanged',
} as const;
export type ActivityActionEnum = (typeof ActivityActionEnum)[keyof typeof ActivityActionEnum];

// AI verification status for ticket validity (TicketDTO.aiVerifyStatus).
export const TicketVerifyStatusEnum = {
  Pending: 'Pending',
  Legitimate: 'Legitimate',
  Suspicious: 'Suspicious',
  Skipped: 'Skipped',
} as const;
export type TicketVerifyStatusEnum = (typeof TicketVerifyStatusEnum)[keyof typeof TicketVerifyStatusEnum];

// Special close reason — currently BE only has 1 value.
export const TicketCloseReasonEnum = {
  MergedDuplicate: 'MergedDuplicate',
} as const;
export type TicketCloseReasonEnum = (typeof TicketCloseReasonEnum)[keyof typeof TicketCloseReasonEnum];

// GH-68 — reaction type for ticket chat (BE ReactionTypeEnum). Send as STRING in body/query.
export const ReactionTypeEnum = {
  ThumbsUp: 'ThumbsUp',
  Acknowledged: 'Acknowledged',
  Resolved: 'Resolved',
  NeedMoreInfo: 'NeedMoreInfo',
  Disagree: 'Disagree',
} as const;
export type ReactionTypeEnum = (typeof ReactionTypeEnum)[keyof typeof ReactionTypeEnum];
