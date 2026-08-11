export const BmsSwitchTarget = {
  Charge: 'charge',
  Discharge: 'discharge',
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
