import { EscalationReasonEnum, TicketStatusEnum } from '../../tickets/types/ticket.types';

export type HoldReasonEnum =
  | 'WAITING_CUSTOMER'
  | 'WAITING_PARTS'
  | 'WAITING_ONSITE_SCHEDULE';

export type StaffSkillTierEnum = 'Tier1' | 'Tier2' | 'Tier3';

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
  reason: HoldReasonEnum;
}

export interface ResolvePayload {
  resolutionSummary: string;
}

export interface EscalatePayload {
  reason: EscalationReasonEnum;
  note?: string;
}

export interface MaintenanceLogPayload {
  description: string;
  actionTaken?: string;
  partsUsed?: string;
  durationMinutes?: number;
}

export interface StaffTicketListParams {
  Status?: TicketStatusEnum;
  PageNumber?: number;
  PageSize?: number;
}
