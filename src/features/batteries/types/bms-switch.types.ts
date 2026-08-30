import type {
  BmsSwitchCommandStatus,
  BmsSwitchTarget,
} from '../enums/bms-switch.enum';

export interface SetBmsSwitchPayload {
  target: BmsSwitchTarget;
  enable: boolean;
}

export interface BmsSwitchCommandAcceptedDto extends SetBmsSwitchPayload {
  cmdId: string;
  topic: string;
}

export interface BmsSwitchPendingCommandDto extends SetBmsSwitchPayload {
  cmdId: string;
  issuedAt: string;
}

export interface BmsSwitchLastCommandDto extends SetBmsSwitchPayload {
  cmdId: string;
  status: BmsSwitchCommandStatus;
  error: string | null;
  ackedAt: string | null;
}

export interface BmsSwitchStateDto {
  chargeEnabled: boolean | null;
  dischargeEnabled: boolean | null;
  updatedAt: string | null;
  pendingCommand: BmsSwitchPendingCommandDto | null;
  lastCommand: BmsSwitchLastCommandDto | null;
}

