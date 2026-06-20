import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { sessionService } from '../services/session.service';
import { getRefreshToken } from '../../../lib/secureStore';

export function useSessions() {
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: QUERY_KEY.sessions.list(),
    queryFn: async () => {
      const res = await sessionService.getSessions(true);
      return res.data.data ?? [];
    },
  });

  const revokeSession = useMutation({
    mutationFn: (sessionId: string) => sessionService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.sessions.list() });
    },
  });

  const revokeAll = useMutation({
    mutationFn: async () => {
      // await bắt buộc — getRefreshToken là async (expo-secure-store)
      const currentRefreshToken = await getRefreshToken();
      return sessionService.revokeAll({
        exceptCurrent: true,
        currentRefreshToken: currentRefreshToken ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.sessions.list() });
    },
  });

  return { sessions, revokeSession, revokeAll };
}
