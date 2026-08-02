import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { useSessionStore } from '@/src/stores/sessionStore';
import { permissionService } from '../services/permission.service';

/**
 * GH-47 — fetch permission tươi của role hiện tại rồi đè vào sessionStore.
 * Token perm[] (decode lúc login/hydration) là snapshot/fallback; endpoint là bản tươi.
 * v5 không còn onSuccess trên useQuery → sync bằng useEffect.
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
