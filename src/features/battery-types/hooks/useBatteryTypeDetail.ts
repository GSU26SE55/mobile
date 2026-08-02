import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { batteryTypeService } from '../services/battery-type.service';

// GH-56 — chi tiết 1 loại pin.
export function useBatteryTypeDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryTypes.detail(id),
    queryFn: () => batteryTypeService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}
