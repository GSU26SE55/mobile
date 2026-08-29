// Cascade risk DTO — GET /api/battery-assets/{id}/cascade-risk (Sprint 7 B4).
import type { CascadeRiskLevel, ElectricalTopologyEnum } from '../enums/cascade.enum';

export { CascadeRiskLevel, ElectricalTopologyEnum } from '../enums/cascade.enum';

export interface CascadeRiskDto {
  batteryAssetId: string;
  serialNumber: string | null;
  siteId: string | null; // null if asset not yet assigned to a site
  cascadeRiskScore: number; // 0.0–1.0
  level: CascadeRiskLevel; // normalised to the name by batteryService.getCascadeRisk
  electricalTopology: ElectricalTopologyEnum; // ditto
  cascadeRiskUpdatedAt: string | null; // null if never computed
}

/**
 * The DTO as it actually arrives: the BE serialises these two enums as their NUMERIC value
 * (CascadeRiskLevel Low=1/Medium=2/High=3), not the string name the comments above used to
 * claim. batteryService.getCascadeRisk converts them before anything else sees the object.
 */
export interface RawCascadeRiskDto
  extends Omit<CascadeRiskDto, 'level' | 'electricalTopology'> {
  level: CascadeRiskLevel | number;
  electricalTopology: ElectricalTopologyEnum | number;
}
