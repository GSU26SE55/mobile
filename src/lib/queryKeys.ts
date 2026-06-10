export const KEY = {
  auth:          ['auth'] as const,
  profile:       ['profile'] as const,
  sessions:      ['sessions'] as const,
  batteries:     ['batteries'] as const,
  tickets:       ['tickets'] as const,
  staffProfile:  ['staffProfile'] as const,
  staffTickets:  ['staffTickets'] as const,
  notifications: ['notifications'] as const,
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
  staffProfile: {
    me: () => [...KEY.staffProfile, 'me'] as const,
  },
  staffTickets: {
    list:   (params?: Record<string, unknown>) => [...KEY.staffTickets, 'list', params] as const,
    detail: (id: string) => [...KEY.staffTickets, 'detail', id] as const,
  },
  notifications: {
    list: (params?: Record<string, unknown>) => [...KEY.notifications, 'list', params] as const,
  },
} as const;
