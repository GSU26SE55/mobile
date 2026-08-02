import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, getRefreshToken, isTokenExpired, saveTokens, clearTokens } from '@/src/lib/secureStore';
import { decodeToken, redirectByRole } from '@/src/types/session.types';
import { useSessionStore } from '@/src/stores/sessionStore';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { axiosInstance } from '@/src/lib/axios';

interface AuthContextValue {
  isHydrating: boolean;
}

const AuthContext = createContext<AuthContextValue>({ isHydrating: true });

export const useAuthContext = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrating, setIsHydrating] = useState(true);
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  useEffect(() => {
    // ADMIN/MANAGER không dùng mobile (redirectByRole → null). Chặn ngay lúc hydrate,
    // ngoài render, thay vì để guard trên cây phải clearTokens() giữa lúc điều hướng.
    const applySession = async (token: string) => {
      const user = decodeToken(token);
      if (!redirectByRole(user.role)) {
        await clearTokens();
        clearSession();
        return;
      }
      setSession(user);
    };

    const hydrate = async () => {
      try {
        const accessToken = await getAccessToken();

        if (accessToken && !isTokenExpired(accessToken)) {
          // Case 1: accessToken còn hạn
          await applySession(accessToken);
        } else {
          const refreshToken = await getRefreshToken();
          if (!refreshToken) {
            // Case 2: không có refreshToken
            clearSession();
          } else {
            // Case 3: có refreshToken → thử refresh
            try {
              const res = await axiosInstance.post<{ data: { tokens: { accessToken: string; refreshToken: string } | null } }>(
                ENDPOINTS.AUTH.REFRESH_TOKEN,
                { refreshToken },
              );
              const tokens = res.data.data?.tokens;
              if (!tokens) throw new Error('Refresh failed');
              await saveTokens(tokens.accessToken, tokens.refreshToken);
              await applySession(tokens.accessToken);
            } catch {
              await clearTokens();
              clearSession();
            }
          }
        }
      } catch {
        await clearTokens();
        clearSession();
      } finally {
        setIsHydrating(false);
      }
    };

    void hydrate();
  }, [setSession, clearSession]);

  return (
    <AuthContext.Provider value={{ isHydrating }}>
      {children}
    </AuthContext.Provider>
  );
}
