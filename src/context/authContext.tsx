import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, getRefreshToken, isTokenExpired, saveTokens, clearTokens } from '../lib/secureStore';
import { decodeToken } from '../types/session.types';
import { useSessionStore } from '../stores/sessionStore';
import { ENDPOINTS } from '../lib/endpoints';
import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

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
    const hydrate = async () => {
      try {
        const accessToken = await getAccessToken();

        if (accessToken && !isTokenExpired(accessToken)) {
          // Case 1: accessToken còn hạn
          setSession(decodeToken(accessToken));
          return;
        }

        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          // Case 2: không có refreshToken
          clearSession();
          return;
        }

        // Case 3: có refreshToken → thử refresh
        try {
          const res = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
            `${BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
            { refreshToken },
          );
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
          await saveTokens(newAccess, newRefresh);
          setSession(decodeToken(newAccess));
        } catch {
          await clearTokens();
          clearSession();
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
