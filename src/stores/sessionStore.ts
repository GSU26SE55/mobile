import { create } from 'zustand';
import { SessionUser } from '../types/session.types';

interface SessionState {
  user: SessionUser | null;
  setSession: (user: SessionUser) => void;
  setPermissions: (permissions: string[]) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setSession: (user) => set({ user }),
  // GH-47 — đè permissions tươi từ /me/permissions lên snapshot token
  setPermissions: (permissions) =>
    set((s) => (s.user ? { user: { ...s.user, permissions } } : s)),
  clearSession: () => set({ user: null }),
}));
