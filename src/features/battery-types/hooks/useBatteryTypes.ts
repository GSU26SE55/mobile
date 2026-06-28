import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { batteryTypeService } from '../services/battery-type.service';
import { BatteryTypeListParams } from '../types/battery-type.types';

// GH-56 — danh sách loại pin (read-only). Search keyword + phân trang.
export function useBatteryTypes(params?: BatteryTypeListParams) {
  return useQuery({
    queryKey: QUERY_KEY.batteryTypes.list(params as Record<string, unknown> | undefined),
    queryFn: () => batteryTypeService.getList(params).then((r) => r.data.data),
  });
}
