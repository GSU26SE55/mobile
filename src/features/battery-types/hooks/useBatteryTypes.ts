import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { batteryTypeService } from '../services/battery-type.service';
import { BatteryTypeListParams } from '../types/battery-type.types';

// GH-56 — battery type list (read-only). Search keyword + pagination.
export function useBatteryTypes(params?: BatteryTypeListParams) {
  return useQuery({
    queryKey: QUERY_KEY.batteryTypes.list(params as Record<string, unknown> | undefined),
    queryFn: () => batteryTypeService.getList(params).then((r) => r.data.data),
  });
}
