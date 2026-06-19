export const KEY = {
  auth:          ['auth'] as const,
  profile:       ['profile'] as const,
  sessions:      ['sessions'] as const,
  batteryAssets: ['batteryAssets'] as const,
  sensorReadings:['sensorReadings'] as const,
  alerts:        ['alerts'] as const,
  tickets:       ['tickets'] as const,
  staffProfile:  ['staffProfile'] as const,
  staffTickets:  ['staffTickets'] as const,
  notifications: ['notifications'] as const,
  files:         ['files'] as const,
  kb:            ['kb'] as const,
} as const;

export const QUERY_KEY = {
  profile: {
    me: () => [...KEY.profile, 'me'] as const,
  },
  sessions: {
    list: (activeOnly?: boolean) => [...KEY.sessions, 'list', activeOnly] as const,
  },
  batteryAssets: {
    me:       (params?: Record<string, unknown>) => [...KEY.batteryAssets, 'me', params] as const,
    detail:   (id: string) => [...KEY.batteryAssets, 'detail', id] as const,
    realtime: (id: string) => [...KEY.batteryAssets, 'realtime', id] as const,
  },
  sensorReadings: {
    latest:    (assetId: string) => [...KEY.sensorReadings, 'latest', assetId] as const,
    history:   (assetId: string, params?: Record<string, unknown>) =>
      [...KEY.sensorReadings, 'history', assetId, params] as const,
    aggregate: (assetId: string, params?: Record<string, unknown>) =>
      [...KEY.sensorReadings, 'aggregate', assetId, params] as const,
  },
  alerts: {
    list:   (params?: Record<string, unknown>) => [...KEY.alerts, 'list', params] as const,
    detail: (id: string) => [...KEY.alerts, 'detail', id] as const,
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
  files: {
    metadata:     (id: string) => [...KEY.files, 'metadata', id] as const,
    presignedUrl: (id: string) => [...KEY.files, 'presigned-url', id] as const,
  },
  kb: {
    list:     (params?: Record<string, unknown>) => [...KEY.kb, 'list', params] as const,
    infinite: (params?: Record<string, unknown>) => [...KEY.kb, 'infinite', params] as const,
    detail:   (id: string) => [...KEY.kb, 'detail', id] as const,
    related:  (ticketId: string) => [...KEY.kb, 'related', ticketId] as const,
  },
} as const;
