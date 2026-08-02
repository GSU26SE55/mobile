import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { handleErrorApi } from '@/src/lib/errors';

// #AUTH-51: Device A gửi cross-device 2FA request. Nhận requestId để Device B dùng.
export function useRequestCrossDevice2fa() {
  return useMutation({
    mutationFn: authService.requestCrossDevice2fa,
    onError: (error) => handleErrorApi({ error }),
  });
}

// #AUTH-51: Device B xác nhận request bằng TOTP.
export function useConfirmCrossDevice2fa() {
  return useMutation({
    mutationFn: authService.confirmCrossDevice2fa,
    onError: (error) => handleErrorApi({ error }),
  });
}
