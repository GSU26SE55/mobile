import { create } from 'zustand';
import { SessionUser } from '@/src/types/session.types';

interface SessionState {
  user: SessionUser | null;
  setSession: (user: SessionUser) => void;
  setPermissions: (permissions: string[]) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setSession: (user) => set({ user }),
  // GH-47 — overwrite the token snapshot with fresh permissions from /me/permissions
  setPermissions: (permissions) =>
    set((s) => (s.user ? { user: { ...s.user, permissions } } : s)),
  clearSession: () => set({ user: null }),
}));
