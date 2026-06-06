import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { accountService } from '../services/account.service';

export function useDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => accountService.disable2FA(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
    },
  });
}
