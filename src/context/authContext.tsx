import { isAxiosError } from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  saveTokens,
  clearTokens,
} from "@/src/lib/secureStore";
import { decodeToken, redirectByRole } from "@/src/types/session.types";
import { useSessionStore } from "@/src/stores/sessionStore";
import { ENDPOINTS } from "@/src/lib/endpoints";
import { axiosInstance } from "@/src/lib/axios";

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
    // ADMIN/MANAGER don't use mobile (redirectByRole → null). Block right at hydration,
    // outside render, instead of leaving the guard on the tree to clearTokens() mid-navigation.
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
          // Case 1: accessToken is still valid
          await applySession(accessToken);
        } else {
          const refreshToken = await getRefreshToken();
          if (!refreshToken) {
            // Case 2: no refreshToken
            clearSession();
          } else {
            // Case 3: has refreshToken → try to refresh
            try {
              const res = await axiosInstance.post<{
                data: {
                  tokens: { accessToken: string; refreshToken: string } | null;
                };
              }>(ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
              const tokens = res.data.data?.tokens;
              if (!tokens) throw new Error("Refresh failed");
              await saveTokens(tokens.accessToken, tokens.refreshToken);
              await applySession(tokens.accessToken);
            } catch (err) {
              // A network drop/timeout (no response) doesn't prove the refresh token is
              // invalid — only a BE response does. Logging out here on a network blip
              // (bad wifi at app launch, etc.) is what caused spurious logouts. Leave
              // tokens/session untouched so the next launch/request can retry.
              if (isAxiosError(err) && !err.response) return;
              await clearTokens();
              clearSession();
            }
          }
        }
      } catch (err) {
        if (isAxiosError(err) && !err.response) return;
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
