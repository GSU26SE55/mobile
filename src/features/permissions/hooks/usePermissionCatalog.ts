import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { permissionService } from '../services/permission.service';

// GH-68 — catalog of all permissions (every role). Rarely changes → long staleTime.
export function usePermissionCatalog(module?: string) {
  return useQuery({
    queryKey: QUERY_KEY.permissions.catalog(module),
    queryFn: async () => {
      const res = await permissionService.getCatalog(module ? { module } : undefined);
      return res.data.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
