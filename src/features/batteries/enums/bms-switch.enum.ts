// Matches the firmware mapping in cmd_logic.cpp: charge=1, discharge=2, all=3.
// The backend accepts only these values; adding one requires updating both sides.
export const BmsSwitchTarget = {
  Charge: 'charge',
  Discharge: 'discharge',
  All: 'all',
} as const;
export type BmsSwitchTarget =
  (typeof BmsSwitchTarget)[keyof typeof BmsSwitchTarget];

export const BmsSwitchCommandStatus = {
  Pending: 1,
  Ok: 2,
  Failed: 3,
  Rejected: 4,
  Unknown: 5,
  TimedOut: 6,
} as const;
export type BmsSwitchCommandStatus =
  (typeof BmsSwitchCommandStatus)[keyof typeof BmsSwitchCommandStatus];
