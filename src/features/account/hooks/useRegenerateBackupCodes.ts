import { useMutation } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import type { RegenBackupPayload } from '../types/account.types';

// GH-295: regenerate 8 new backup codes — invalidates old codes (requires TOTP)
export function useRegenerateBackupCodes() {
  return useMutation({
    mutationFn: (data: RegenBackupPayload) => accountService.regenerateBackupCodes(data),
  });
}
