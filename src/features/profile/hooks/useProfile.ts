import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { profileService } from '../services/profile.service';

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEY.profile.me(),
    queryFn: async () => {
      const res = await profileService.getMe();
      return res.data.data;
    },
  });
}
