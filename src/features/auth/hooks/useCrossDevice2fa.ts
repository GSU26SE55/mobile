import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { handleErrorApi } from '@/src/lib/errors';

// #AUTH-51: Device A sends a cross-device 2FA request. Receives a requestId for Device B to use.
export function useRequestCrossDevice2fa() {
  return useMutation({
    mutationFn: authService.requestCrossDevice2fa,
    onError: (error) => handleErrorApi({ error }),
  });
}

// #AUTH-51: Device B confirms the request with a TOTP.
export function useConfirmCrossDevice2fa() {
  return useMutation({
    mutationFn: authService.confirmCrossDevice2fa,
    onError: (error) => handleErrorApi({ error }),
  });
}
