import { useMutation } from '@tanstack/react-query';
import { accountService } from '../services/account.service';

// GH-295: 2FA enroll step 1 — generates secret + QR + pendingToken (NOT activated yet)
export function useInit2FA() {
  return useMutation({
    mutationFn: () => accountService.init2FA(),
  });
}
