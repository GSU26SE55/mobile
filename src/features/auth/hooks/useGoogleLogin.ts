import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { GoogleLoginPayload } from '../types/auth.types';
import { handleLoginSuccess } from './handleLoginSuccess';

export function useGoogleLogin() {
  return useMutation({
    mutationFn: (data: GoogleLoginPayload) => authService.googleLogin(data),
    onSuccess: (res) => handleLoginSuccess(res.data.data!),
    // No onError handling — error propagates to the caller (GoogleSignInButton try-catch)
  });
}
