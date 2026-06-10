import type { EscalationReasonEnum, TicketStatusEnum } from '../../tickets/types/ticket.types';

export { HoldReasonEnum, StaffSkillTierEnum } from '../enums/staff.enum';

import type { HoldReasonEnum, StaffSkillTierEnum } from '../enums/staff.enum';

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
