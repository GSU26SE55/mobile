import { useMutation } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import { ChangeEmailPayload } from '../types/account.types';

export function useChangeEmail() {
  return useMutation({
    mutationFn: (data: ChangeEmailPayload) => accountService.changeEmail(data),
  });
}
