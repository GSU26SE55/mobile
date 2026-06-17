import { useMutation } from '@tanstack/react-query';
import { accountService } from '../services/account.service';

// GH-295: bước 1 enroll 2FA — sinh secret + QR + pendingToken (CHƯA activate)
export function useInit2FA() {
  return useMutation({
    mutationFn: () => accountService.init2FA(),
  });
}
