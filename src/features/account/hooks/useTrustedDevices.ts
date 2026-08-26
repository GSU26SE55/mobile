import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '@/src/lib/queryKeys';
import { trustedDeviceService } from '../services/trustedDevice.service';

// #AUTH-48: manage trusted devices — query list + revoke one / revoke all.
export function useTrustedDevices() {
  const queryClient = useQueryClient();

  const devices = useQuery({
    queryKey: QUERY_KEY.trustedDevices.list(),
    queryFn: async () => {
      const res = await trustedDeviceService.list();
      return res.data.data ?? [];
    },
    staleTime: 60_000,
  });

  const revokeOne = useMutation({
    mutationFn: (id: string) => trustedDeviceService.revokeOne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.trustedDevices });
    },
  });

  const revokeAll = useMutation({
    mutationFn: () => trustedDeviceService.revokeAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.trustedDevices });
    },
  });

  return { devices, revokeOne, revokeAll };
}
