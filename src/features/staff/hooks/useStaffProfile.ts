import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { staffService } from '../services/staff.service';
import { StaffProfileDTO } from '../types/staff.types';

export function useStaffProfile() {
  return useQuery({
    queryKey: QUERY_KEY.staffProfile.me(),
    queryFn: async (): Promise<StaffProfileDTO> => {
      const res = await staffService.getProfile();
      const account = res.data.data!;
      return {
        accountId:            account.id,
        employeeCode:         account.staffProfile?.employeeCode ?? '',
        fullName:             account.fullName,
        email:                account.email,
        phone:                account.phoneNumber,
        department:           account.staffProfile?.department ?? null,
        // TODO(BE): getProfile() doesn't yet provide skillTier & currentTicketCount → null (UI hides it instead of showing a fake value).
        skillTier:            null,
        maxConcurrentTickets: account.staffProfile?.maxConcurrentTickets ?? 5,
        currentTicketCount:   null,
        isAvailable:          account.staffProfile?.isAvailable ?? true,
        notes:                account.staffProfile?.notes ?? null,
        skills:               Array.isArray(account.staffProfile?.skills)
                                ? account.staffProfile!.skills!.map((s) => s.skillCode)
                                : [],
        avatarUrl:            account.displayAvatarUrl,
      };
    },
    retry: false,
  });
}
