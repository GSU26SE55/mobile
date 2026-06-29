import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { accountService } from '../services/account.service';
import type { LoginHistoryParams } from '../types/account.types';

export function useLoginHistory(params?: LoginHistoryParams) {
  return useQuery({
    queryKey: QUERY_KEY.loginHistory.list(params as Record<string, unknown>),
    queryFn: () => accountService.getLoginHistory(params).then((r) => r.data.data),
    staleTime: 60 * 1000,
  });
}
