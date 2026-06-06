export const KEY = {
  auth:      ['auth'] as const,
  profile:   ['profile'] as const,
  sessions:  ['sessions'] as const,
  batteries: ['batteries'] as const,
  tickets:   ['tickets'] as const,
} as const;

export const QUERY_KEY = {
  profile: {
    me: () => [...KEY.profile, 'me'] as const,
  },
  sessions: {
    list: (activeOnly?: boolean) => [...KEY.sessions, 'list', activeOnly] as const,
  },
  batteries: {
    list:   (params?: Record<string, unknown>) => [...KEY.batteries, 'list', params] as const,
    detail: (id: string) => [...KEY.batteries, 'detail', id] as const,
  },
  tickets: {
    list:   (params?: Record<string, unknown>) => [...KEY.tickets, 'list', params] as const,
    detail: (id: string) => [...KEY.tickets, 'detail', id] as const,
  },
} as const;
