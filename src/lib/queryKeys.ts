export const KEY = {
  auth:          ['auth'] as const,
  profile:       ['profile'] as const,
  sessions:      ['sessions'] as const,
  trustedDevices:['trustedDevices'] as const,
  batteryAssets: ['batteryAssets'] as const,
  sensorReadings:['sensorReadings'] as const,
  sites:         ['sites'] as const,   // GH-57
  ambient:       ['ambient'] as const, // GH-57
  alerts:        ['alerts'] as const,
  incidents:     ['incidents'] as const, // GH-55 — environmental incidents
  tickets:       ['tickets'] as const,
  staffProfile:  ['staffProfile'] as const,
  staffTickets:  ['staffTickets'] as const,
  notifications: ['notifications'] as const,
  notificationPreferences: ['notificationPreferences'] as const,
  files:         ['files'] as const,
  kb:            ['kb'] as const,
  permissions:   ['permissions'] as const, // GH-47
  batteryTypes:  ['batteryTypes'] as const, // GH-56
  iotDevices:    ['iotDevices'] as const,   // GH-56
  loginHistory:  ['loginHistory'] as const,
  chatsInbox:    ['chatsInbox'] as const,   // GH-68 — /chats/me
  chatMentions:  ['chatMentions'] as const, // GH-68 — /chats/mentions/me
} as const;

export const QUERY_KEY = {
  profile: {
    me: () => [...KEY.profile, 'me'] as const,
  },
  sessions: {
    list: (activeOnly?: boolean) => [...KEY.sessions, 'list', activeOnly] as const,
  },
  trustedDevices: {
    list: () => [...KEY.trustedDevices, 'list'] as const,
  },
  batteryAssets: {
    me:          (params?: Record<string, unknown>) => [...KEY.batteryAssets, 'me', params] as const,
    detail:      (id: string) => [...KEY.batteryAssets, 'detail', id] as const,
    realtime:    (id: string) => [...KEY.batteryAssets, 'realtime', id] as const,
    cascadeRisk: (id: string) => [...KEY.batteryAssets, 'cascade-risk', id] as const, // GH-57
  },
  sites: {
    me:        (params?: Record<string, unknown>) => [...KEY.sites, 'me', params] as const,
    detail:    (id: string) => [...KEY.sites, 'detail', id] as const,
    dashboard: (id: string) => [...KEY.sites, 'dashboard', id] as const,
    assets:    (id: string, params?: Record<string, unknown>) => [...KEY.sites, 'assets', id, params] as const,
  },
  ambient: {
    latest: (siteId: string) => [...KEY.ambient, 'latest', siteId] as const,
    trend:  (siteId: string, params?: Record<string, unknown>) => [...KEY.ambient, 'trend', siteId, params] as const,
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
  incidents: { // GH-55 — environmental incidents
    list:        (params?: Record<string, unknown>) => [...KEY.incidents, 'list', params] as const,
    detail:      (id: string) => [...KEY.incidents, 'detail', id] as const,
    bySiteActive:(siteId: string) => [...KEY.incidents, 'by-site-active', siteId] as const, // GH-68
  },
  tickets: {
    list:           (params?: Record<string, unknown>) => [...KEY.tickets, 'list', params] as const,
    detail:         (id: string) => [...KEY.tickets, 'detail', id] as const,
    chats:          (id: string) => [...KEY.tickets, 'chats', id] as const,   // GH-44/GH-68 — infinite (cursor). Giữ key cho realtime prepend
    chatUnreadCount:(id: string) => [...KEY.tickets, 'chat-unread-count', id] as const, // GH-68
    chatReactions:  (tid: string, cid: string) => [...KEY.tickets, 'chat-reactions', tid, cid] as const, // GH-68
    activities:     (id: string) => [...KEY.tickets, 'activities', id] as const, // GH-44
  },
  staffProfile: {
    me: () => [...KEY.staffProfile, 'me'] as const,
  },
  staffTickets: {
    list:   (params?: Record<string, unknown>) => [...KEY.staffTickets, 'list', params] as const,
    detail: (id: string) => [...KEY.staffTickets, 'detail', id] as const,
    myLogs: () => [...KEY.staffTickets, 'my-logs'] as const, // GH-44 #3
    dashboardStats: () => [...KEY.staffTickets, 'dashboard-stats'] as const, // GH-67
  },
  notifications: {
    list: (params?: Record<string, unknown>) => [...KEY.notifications, 'list', params] as const,
    unreadCount: () => [...KEY.notifications, 'unread-count'] as const,
  },
  notificationPreferences: {
    detail: () => [...KEY.notificationPreferences, 'detail'] as const,
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
    suggest:  (ticketId: string) => [...KEY.kb, 'suggest', ticketId] as const, // GH-44 #7
  },
  permissions: {
    me:      () => [...KEY.permissions, 'me'] as const, // GH-47
    catalog: (module?: string) => [...KEY.permissions, 'catalog', module ?? null] as const, // GH-68
  },
  chatsInbox: {
    list: (params?: Record<string, unknown>) => [...KEY.chatsInbox, 'list', params] as const, // GH-68
  },
  chatMentions: {
    list: (params?: Record<string, unknown>) => [...KEY.chatMentions, 'list', params] as const, // GH-68
  },
  batteryTypes: {
    list:   (params?: Record<string, unknown>) => [...KEY.batteryTypes, 'list', params] as const, // GH-56
    detail: (id: string) => [...KEY.batteryTypes, 'detail', id] as const,
  },
  iotDevices: {
    byCode:       (deviceCode: string) => [...KEY.iotDevices, 'by-code', deviceCode] as const, // GH-56
    calibrations: (deviceId: string, params?: Record<string, unknown>) =>
      [...KEY.iotDevices, 'calibrations', deviceId, params] as const,
  },
  loginHistory: {
    list: (params?: Record<string, unknown>) => [...KEY.loginHistory, 'list', params] as const,
  },
} as const;
