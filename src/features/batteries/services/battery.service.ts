import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { CommonResponse, PaginationResponse } from '@/src/types/api.types';
import {
  BatteryAssetDto,
  BatteryAssetRealtimeDto,
  BatteryAssetListParams,
} from '../types/battery.types';
import { CascadeRiskDto, RawCascadeRiskDto } from '../types/cascade.types';
import {
  CASCADE_RISK_LEVEL_BY_VALUE,
  CascadeRiskLevel,
  ELECTRICAL_TOPOLOGY_BY_VALUE,
  ElectricalTopologyEnum,
} from '../enums/cascade.enum';
import { MaintenanceCycleDto } from '../types/maintenance-cycle.types';

export const batteryService = {
  getMyAssets: (params?: BatteryAssetListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryAssetDto>>>(
      ENDPOINTS.BATTERY_ASSETS.MY,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryAssetDto>>(
      ENDPOINTS.BATTERY_ASSETS.DETAIL(id),
    ),
  getRealtime: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryAssetRealtimeDto>>(
      ENDPOINTS.BATTERY_ASSETS.REALTIME(id),
    ),
  // The BE sends `level` and `electricalTopology` as numbers, but CascadeRiskBadge keys its
  // style map by the NAME and BmsSwitchSheet gates the high-risk interlock on `level === 'High'`.
  // Left raw, every lookup misses: the badge falls back to its "unknown ⇒ High" tier so a Low
  // asset reads as High, and the interlock never trips at all. Normalising here fixes both
  // without either component having to know the wire format.
  getCascadeRisk: async (id: string) => {
    const res = await axiosInstance.get<CommonResponse<RawCascadeRiskDto>>(
      ENDPOINTS.BATTERY_ASSETS.CASCADE_RISK(id),
    );
    const raw = res.data.data;
    if (!raw) return res as unknown as typeof res & { data: CommonResponse<CascadeRiskDto> };
    const normalised: CascadeRiskDto = {
      ...raw,
      level:
        typeof raw.level === 'number'
          ? // An unmapped number must not read as "Low/safe" on a fire-safety signal — fall
            // back to High, matching CascadeRiskBadge's own cautious default.
            (CASCADE_RISK_LEVEL_BY_VALUE[raw.level] ?? CascadeRiskLevel.High)
          : raw.level,
      electricalTopology:
        typeof raw.electricalTopology === 'number'
          ? (ELECTRICAL_TOPOLOGY_BY_VALUE[raw.electricalTopology] ??
            ElectricalTopologyEnum.Independent)
          : raw.electricalTopology,
    };
    return { ...res, data: { ...res.data, data: normalised } };
  },

  getMaintenanceCycles: (id: string) =>
    axiosInstance.get<CommonResponse<MaintenanceCycleDto[]>>(
      ENDPOINTS.BATTERY_ASSETS.MAINTENANCE_CYCLES(id),
    ),
};
