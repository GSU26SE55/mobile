export const TicketStatusEnum = {
  New: 'New',
  Open: 'Open',
  Approved: 'Approved',
  Assigned: 'Assigned',
  InProgress: 'InProgress',
  WaitingCustomer: 'WaitingCustomer',
  WaitingParts: 'WaitingParts',
  WaitingOnsiteSchedule: 'WaitingOnsiteSchedule',
  Resolved: 'Resolved',
  Escalated: 'Escalated',
  ClosedPendingRate: 'ClosedPendingRate',
  Closed: 'Closed',
  ClosedRejected: 'ClosedRejected',
  Incident: 'Incident',
} as const;
export type TicketStatusEnum = (typeof TicketStatusEnum)[keyof typeof TicketStatusEnum];

export const TicketPriorityEnum = {
  P1Critical: 'P1Critical',
  P2High: 'P2High',
  P3Normal: 'P3Normal',
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
  CreatedByStaff: 'CreatedByStaff',
  // Sprint Bonus NS-13/NS-22 — hệ thống tự tạo (cascade risk High, sự cố môi trường Critical).
  // JsonStringEnumConverter → wire là CHUỖI 'System'; int 4 ở docs/api-ticket.md:168 là cross-service BE↔BE.
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
  WaitingCustomer: 'WaitingCustomer',
  WaitingParts: 'WaitingParts',
  WaitingOnsiteSchedule: 'WaitingOnsiteSchedule',
} as const;
export type PauseReasonEnum = (typeof PauseReasonEnum)[keyof typeof PauseReasonEnum];

export const MaintenanceLogTypeEnum = {
  RemoteSupport: 'RemoteSupport',
  OnSite: 'OnSite',
  PartReplacement: 'PartReplacement',
  Inspection: 'Inspection',
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

export const ActivityActionEnum = {
  Created: 'Created',
  StatusChanged: 'StatusChanged',
  PriorityAssigned: 'PriorityAssigned',
  StaffAssigned: 'StaffAssigned',
  StaffReassigned: 'StaffReassigned',
  Commented: 'Commented',
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
  AutoClosed: 'AutoClosed',
  ResolvedByEscalatedStaff: 'ResolvedByEscalatedStaff',
  TriageApproved: 'TriageApproved',
  Closed: 'Closed',
} as const;
export type ActivityActionEnum = (typeof ActivityActionEnum)[keyof typeof ActivityActionEnum];

// GH-68 — loại reaction cho ticket chat (BE ReactionTypeEnum). Gửi STRING trong body/query.
export const ReactionTypeEnum = {
  ThumbsUp: 'ThumbsUp',
  Acknowledged: 'Acknowledged',
  Resolved: 'Resolved',
  NeedMoreInfo: 'NeedMoreInfo',
  Disagree: 'Disagree',
} as const;
export type ReactionTypeEnum = (typeof ReactionTypeEnum)[keyof typeof ReactionTypeEnum];
