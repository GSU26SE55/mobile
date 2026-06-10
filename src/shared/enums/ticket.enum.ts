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
} as const;
export type ActivityActionEnum = (typeof ActivityActionEnum)[keyof typeof ActivityActionEnum];
