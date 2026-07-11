import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { LoginPayload } from '../types/auth.types';
import { handleLoginSuccess } from './handleLoginSuccess';

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginPayload) => authService.login(data),
    onSuccess: (res) => handleLoginSuccess(res.data.data!),
    // Không xử lý onError — error propagate lên caller (LoginForm try-catch)
  });
}
