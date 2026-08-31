import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffService } from '../services/staff.service';

export function useCustomerAccount(customerId?: string | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY.staffProfile.customerDetail(customerId ?? ''),
    queryFn: () => staffService.getCustomerById(customerId as string).then((r) => r.data.data),
    enabled: enabled && !!customerId,
    staleTime: 5 * 60 * 1000,
  });
}
