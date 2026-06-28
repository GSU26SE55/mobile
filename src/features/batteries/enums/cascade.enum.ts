// Cascade risk enums (Sprint 7 B4) — mirror docs/api-battery.md.
// ⚠️ BE trả các field này dạng STRING ("High", "SeriesString"), không phải int.

export const CascadeRiskLevel = {
  Low: 'Low',       // score < 0.5
  Medium: 'Medium', // 0.5 – < 0.7
  High: 'High',     // >= 0.7
} as const;
export type CascadeRiskLevel = (typeof CascadeRiskLevel)[keyof typeof CascadeRiskLevel];

export const ElectricalTopologyEnum = {
  Independent: 'Independent',     // pin đơn lẻ
  SeriesString: 'SeriesString',  // nối tiếp
  ParallelBank: 'ParallelBank',  // song song
  SeriesParallel: 'SeriesParallel', // hỗn hợp
} as const;
export type ElectricalTopologyEnum =
  (typeof ElectricalTopologyEnum)[keyof typeof ElectricalTopologyEnum];
