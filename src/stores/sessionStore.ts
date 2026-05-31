import { create } from 'zustand';
import { SessionUser } from '../types/session.types';

interface SessionState {
  user: SessionUser | null;
  setSession: (user: SessionUser) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setSession: (user) => set({ user }),
  clearSession: () => set({ user: null }),
}));
