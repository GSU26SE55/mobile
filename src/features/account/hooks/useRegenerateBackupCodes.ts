import { useMutation } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import type { RegenBackupPayload } from '../types/account.types';

// GH-295: sinh lại 8 backup codes mới — vô hiệu hóa codes cũ (cần TOTP)
export function useRegenerateBackupCodes() {
  return useMutation({
    mutationFn: (data: RegenBackupPayload) => accountService.regenerateBackupCodes(data),
  });
}
