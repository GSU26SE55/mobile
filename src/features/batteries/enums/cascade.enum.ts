// Cascade risk enums (Sprint 7 B4) — mirror docs/api-battery.md.
// ⚠️ BE returns these fields as STRING ("High", "SeriesString"), not int.

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
