// Cascade risk enums (Sprint 7 B4) — mirror docs/api-battery.md.
// ⚠️ The BE actually returns these as the NUMERIC enum value (Low=1/Medium=2/High=3), despite
// what this comment used to say. The names below are what the UI works with, so
// batteryService.getCascadeRisk maps number → name before any component sees the payload.
// NUMERIC_ORDER must stay aligned with BE CascadeRiskLevel.cs / ElectricalTopology.

export const CascadeRiskLevel = {
  Low: 'Low',       // score < 0.5
  Medium: 'Medium', // 0.5 – < 0.7
  High: 'High',     // >= 0.7
} as const;
export type CascadeRiskLevel = (typeof CascadeRiskLevel)[keyof typeof CascadeRiskLevel];

export const ElectricalTopologyEnum = {
  Independent: 'Independent',     // single battery
  SeriesString: 'SeriesString',  // series
  ParallelBank: 'ParallelBank',  // parallel
  SeriesParallel: 'SeriesParallel', // mixed
} as const;
export type ElectricalTopologyEnum =
  (typeof ElectricalTopologyEnum)[keyof typeof ElectricalTopologyEnum];

/** BE numeric value → name, for normalising cascade-risk responses. */
export const CASCADE_RISK_LEVEL_BY_VALUE: Record<number, CascadeRiskLevel> = {
  1: CascadeRiskLevel.Low,
  2: CascadeRiskLevel.Medium,
  3: CascadeRiskLevel.High,
};

export const ELECTRICAL_TOPOLOGY_BY_VALUE: Record<number, ElectricalTopologyEnum> = {
  1: ElectricalTopologyEnum.Independent,
  2: ElectricalTopologyEnum.SeriesString,
  3: ElectricalTopologyEnum.ParallelBank,
  4: ElectricalTopologyEnum.SeriesParallel,
};
