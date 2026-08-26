import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { useSessionStore } from '@/src/stores/sessionStore';
import { permissionService } from '../services/permission.service';

/**
 * GH-47 — fetches fresh permissions for the current role and overwrites sessionStore.
 * The token's perm[] (decoded at login/hydration) is a snapshot/fallback; the endpoint is the fresh source.
 * v5 no longer has onSuccess on useQuery → sync via useEffect instead.
 */
export function useMyPermissions() {
  const user = useSessionStore((s) => s.user);
  const setPermissions = useSessionStore((s) => s.setPermissions);

  const query = useQuery({
    queryKey: QUERY_KEY.permissions.me(),
    queryFn: async () => {
      const res = await permissionService.getMyPermissions();
      return res.data.data?.permissions ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data } = query;
  useEffect(() => {
    if (data) setPermissions(data.map((p) => p.code));
  }, [data, setPermissions]);

  return query;
}
