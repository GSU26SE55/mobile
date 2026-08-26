// Cascade risk DTO — GET /api/battery-assets/{id}/cascade-risk (Sprint 7 B4).
import type { CascadeRiskLevel, ElectricalTopologyEnum } from '../enums/cascade.enum';

export { CascadeRiskLevel, ElectricalTopologyEnum } from '../enums/cascade.enum';

export interface CascadeRiskDto {
  batteryAssetId: string;
  serialNumber: string | null;
  siteId: string | null; // null if asset not yet assigned to a site
  cascadeRiskScore: number; // 0.0–1.0
  level: CascadeRiskLevel; // string — derived from score
  electricalTopology: ElectricalTopologyEnum; // string
  cascadeRiskUpdatedAt: string | null; // null if never computed
}
