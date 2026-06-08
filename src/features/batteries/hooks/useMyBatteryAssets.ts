import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { batteryService } from '../services/battery.service';

export function useMyBatteryAssets() {
  return useQuery({
    queryKey: QUERY_KEY.batteries.list({ me: true }),
    queryFn: async () => {
      const res = await batteryService.getMyAssets({ pageSize: 100 });
      return res.data.data?.items ?? [];
    },
  });
}
