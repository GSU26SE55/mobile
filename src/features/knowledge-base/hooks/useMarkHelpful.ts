import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { handleErrorApi } from '../../../lib/errors';
import { knowledgeBaseService } from '../services/knowledge-base.service';

export function useMarkHelpful(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => knowledgeBaseService.markHelpful(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.knowledgeBase.detail(id) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
