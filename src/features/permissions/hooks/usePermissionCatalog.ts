import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { permissionService } from '../services/permission.service';

// GH-68 — catalog toàn bộ permission (mọi role). Ít đổi → staleTime dài.
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
