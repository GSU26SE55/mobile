export const ENDPOINTS = {
  AUTH: {
    LOGIN:             '/api/auth/login',
    GOOGLE:            '/api/auth/google',            // Google login — mobile gửi idToken (native Google Sign-In)
    LOGIN_VERIFY_2FA:  '/api/auth/login/verify-2fa', // GH-295 — bước 2 của 2FA login
    LOGIN_2FA_SMS:     '/api/auth/login/2fa/sms',    // #AUTH-58 — gửi OTP qua SMS (fallback)
    TWO_FA_CROSS_DEVICE_REQUEST: '/api/auth/2fa/cross-device-confirm/request', // #AUTH-51 — Device A gửi request
    TWO_FA_CROSS_DEVICE_CONFIRM: '/api/auth/2fa/cross-device-confirm',         // #AUTH-51 — Device B xác nhận
    REACTIVATE_REQUEST:'/api/auth/reactivate-request', // #AUTH-50 — bước 1 khôi phục account
    REACTIVATE_VERIFY: '/api/auth/reactivate-verify',  // #AUTH-50 — bước 2 khôi phục account
    REGISTER:          '/api/auth/register',
    VERIFY_OTP:        '/api/auth/verify-otp',
    RESEND_OTP:        '/api/auth/resend-otp',
    FORGOT_PASSWORD:   '/api/auth/forgot-password',
    VERIFY_RESET_OTP:  '/api/auth/verify-reset-otp',
    RESEND_RESET_OTP:  '/api/auth/resend-reset-otp',
    RESET_PASSWORD:    '/api/auth/reset-password',
    REFRESH_TOKEN:     '/api/auth/refresh-token',
    LOGOUT:            '/api/auth/logout',
    ME_PERMISSIONS:    '/api/auth/me/permissions', // GH-47 — permission tươi của role hiện tại
  },
  PROFILE: {
    ME:     '/api/auth/me',
    UPDATE: '/api/auth/me/profile',
    AVATAR: '/api/auth/me/avatar',
  },
  ACCOUNT: {
    CHANGE_PASSWORD:      '/api/accounts/me/password',
    CHANGE_EMAIL:         '/api/accounts/me/change-email',
    CONFIRM_EMAIL_CHANGE: '/api/accounts/me/confirm-email-change',
    SEND_PHONE_OTP:       '/api/accounts/me/send-phone-otp',
    VERIFY_PHONE_OTP:     '/api/accounts/me/verify-phone-otp',
    // GH-295: flow 2FA 2 bước. /enable cũ đã 410 Gone — không dùng.
    INIT_2FA:             '/api/accounts/me/2fa/init',
    CONFIRM_2FA:          '/api/accounts/me/2fa/confirm',
    DISABLE_2FA:          '/api/accounts/me/2fa/disable',
    BACKUP_REGEN_2FA:     '/api/accounts/me/2fa/backup-codes/regenerate',
    LINK_GOOGLE:          '/api/accounts/me/link-google',
    UNLINK_GOOGLE:        '/api/accounts/me/unlink-google',
    DEACTIVATE:           '/api/accounts/me/deactivate',
    DELETE:               '/api/accounts/me',
    LOGIN_HISTORY:        '/api/accounts/me/login-history', // #AUTH-62 — lịch sử đăng nhập
    // #AUTH-48 — trusted devices (GET list + DELETE all dùng chung path; DELETE 1 dùng TRUSTED_DEVICE)
    TRUSTED_DEVICES:      '/api/accounts/me/trusted-devices',
    TRUSTED_DEVICE:       (id: string) => `/api/accounts/me/trusted-devices/${id}`,
    EXPORT:               '/api/accounts/me/export', // #AUTH-62 — GDPR data export
  },
  SESSIONS: {
    ME:         '/api/sessions/me',
    REVOKE:     (id: string) => `/api/sessions/${id}`,
    REVOKE_ALL: '/api/sessions/revoke-all',
  },
  FILES: {
    UPLOAD:        '/api/files/upload',
    METADATA:      (id: string) => `/api/files/${id}/metadata`,
    DOWNLOAD:      (id: string) => `/api/files/${id}/download`,
    PRESIGNED_URL: (id: string) => `/api/files/${id}/presigned-url`,
    DELETE:        (id: string) => `/api/files/${id}`,
  },
  BATTERY_ASSETS: {
    MY:           '/api/battery-assets/me',
    DETAIL:       (id: string) => `/api/battery-assets/${id}`,
    REALTIME:     (id: string) => `/api/battery-assets/${id}/realtime`,
    CASCADE_RISK: (id: string) => `/api/battery-assets/${id}/cascade-risk`, // GH-57 (Sprint 7 B4)
  },
  SENSOR_READINGS: {
    LATEST:    (assetId: string) => `/api/sensor-readings/${assetId}/latest`,
    HISTORY:   (assetId: string) => `/api/sensor-readings/${assetId}/history`,
    AGGREGATE: (assetId: string) => `/api/sensor-readings/${assetId}/aggregate`,
    // GH-74 (NS-06 #650) — bucket cố định 1h từ TimescaleDB continuous aggregate.
    // Cùng shape response với AGGREGATE nhưng KHÔNG nhận `interval`. Dùng cho range dài.
    AGGREGATE_HOURLY: (assetId: string) => `/api/sensor-readings/${assetId}/aggregate/hourly`,
    // GH-57 — SSE telemetry live stream (docs/battery-realtime-description.md §3).
    // Path tĩnh; hook tự ghép BASE_URL + ?scope=&access_token=. KHÔNG gọi qua axios.
    STREAM:    '/api/sensor-readings/stream',
  },
  SITES: {
    MY:        '/api/sites/me',
    DETAIL:    (id: string) => `/api/sites/${id}`,
    DASHBOARD: (id: string) => `/api/sites/${id}/dashboard`,
    ASSETS:    (id: string) => `/api/sites/${id}/assets`,
  },
  AMBIENT: {
    LATEST:  '/api/ambient/readings/latest',  // ?siteId=
    HISTORY: '/api/ambient/readings/history', // ?siteId=&from=&to=&pageNumber=&pageSize=
  },
  REPORTS: {
    AMBIENT_TREND: '/api/reports/ambient-trend', // ?siteId=&from=&to=&granularity=
  },
  ALERTS: {
    LIST:        '/api/alerts',
    DETAIL:      (id: string) => `/api/alerts/${id}`,
    ACKNOWLEDGE: (id: string) => `/api/alerts/${id}/acknowledge`,
    RESOLVE:     (id: string) => `/api/alerts/${id}/resolve`, // GH-55 — PATCH, Staff-only
  },
  ENVIRONMENTAL_INCIDENTS: {
    LIST:        '/api/environmental-incidents',                                   // GET ?siteId&status&incidentType&from&to&pageSize
    DETAIL:      (id: string) => `/api/environmental-incidents/${id}`,
    ACKNOWLEDGE: (id: string) => `/api/environmental-incidents/${id}/acknowledge`, // POST, Staff-only
    RESOLVE:     (id: string) => `/api/environmental-incidents/${id}/resolve`,     // POST { resolutionNote }, Staff-only
    BY_SITE_ACTIVE: (siteId: string) => `/api/environmental-incidents/by-site/${siteId}/active`, // GH-68 — GET Open+Acknowledged 1 call
  },
  TICKETS: {
    CUSTOMER_LIST:   '/api/customer/tickets/me',
    CUSTOMER_CREATE: '/api/customer/tickets',
    DETAIL:          (id: string) => `/api/tickets/${id}`,
    PARTICIPANTS:    (id: string) => `/api/tickets/${id}/participants`,
    CHATS:           (id: string) => `/api/tickets/${id}/chats`,   // GET list (?page&pageSize) + POST (BE migration 20260622)
    CHAT_DETAIL:     (tid: string, cid: string) => `/api/tickets/${tid}/chats/${cid}`, // PUT (edit) / DELETE
    CHAT_MARK_READ:  (tid: string) => `/api/tickets/${tid}/chats/mark-read`, // POST { chatIds }
    CHAT_TRANSLATE:  (tid: string, cid: string) => `/api/tickets/${tid}/chats/${cid}/translate`, // POST ?to=
    CHAT_VOICE:      (tid: string) => `/api/tickets/${tid}/chats/voice`, // POST multipart — field "AudioFile"
    // GH-68 — Mọi role
    CHATS_CURSOR:        (tid: string) => `/api/tickets/${tid}/chats/cursor`,        // GET ?cursor&limit(≤100,def20)
    CHAT_UNREAD_COUNT:   (tid: string) => `/api/tickets/${tid}/chats/unread-count`,  // GET → { unreadCount } (per-ticket, KHÔNG bulk — ≠ NOTIFICATIONS.UNREAD_COUNT)
    CHAT_REACTIONS:      (tid: string, cid: string) => `/api/tickets/${tid}/chats/${cid}/reactions`, // POST { reactionType } / DELETE ?type=
    CHAT_ATTACHMENT_DOWNLOAD: (tid: string, cid: string, fileId: string) =>
      `/api/tickets/${tid}/chats/${cid}/attachments/${fileId}/download`,             // GET → CommonResponse<string> URL; HTTP 200/202/451/404. {attachmentId}=FileId
    // GH-67 — Staff/Manager/Admin chat actions
    CHAT_PIN:        (tid: string, cid: string) => `/api/tickets/${tid}/chats/${cid}/pin`, // POST pin / DELETE unpin
    CHAT_SUGGEST:    (tid: string) => `/api/tickets/${tid}/chats/suggest`,        // POST { intent } (AI)
    CHAT_SUMMARIZE:  (tid: string) => `/api/tickets/${tid}/chats/summarize`,      // POST (AI)
    CHAT_SENTIMENT:  (tid: string) => `/api/tickets/${tid}/chats/sentiment-check`, // POST (AI)
    CHAT_EXPORT_PDF: (tid: string) => `/api/tickets/${tid}/chats/export-pdf`,     // GET application/pdf
    ACTIVITIES:      (id: string) => `/api/tickets/${id}/activities`, // GH-44 — timeline
    REOPEN:          (id: string) => `/api/customer/tickets/${id}/reopen`,
    RATE:            (id: string) => `/api/customer/tickets/${id}/rate`,
  },
  // GH-68 — chat cross-ticket (Mọi role)
  CHATS: {
    ME:              '/api/chats/me',                                        // GET ?page&pageSize → flat TicketChatDTO[]
    MENTIONS_ME:     '/api/chats/mentions/me',                              // GET ?unreadOnly&page&pageSize
    MENTION_ACK:     (id: string) => `/api/chats/mentions/${id}/acknowledge`, // PATCH
    ERASE_MY_DATA:   '/api/chats/erase-my-data',                           // POST → { erasedCount }
  },
  PERMISSIONS: {
    CATALOG: '/api/permissions', // GH-68 — catalog toàn bộ permission (mọi role); ?module
  },
  STAFF: {
    ME: '/api/auth/me',
  },
  STAFF_TICKETS: {
    MY_LIST:          '/api/staff/tickets/me',
    DASHBOARD_STATS:  '/api/staff/tickets/dashboard/stats', // GH-67 — KPI snapshot theo JWT

    START:            (id: string) => `/api/staff/tickets/${id}/start`,
    HOLD:             (id: string) => `/api/staff/tickets/${id}/hold`,
    RESUME:           (id: string) => `/api/staff/tickets/${id}/resume`,
    RESOLVE:          (id: string) => `/api/staff/tickets/${id}/resolve`,
    ESCALATE_REQUEST: (id: string) => `/api/staff/tickets/${id}/escalate-request`,
    MAINTENANCE_LOG:  (id: string) => `/api/tickets/${id}/maintenance-logs`,
    MY_MAINTENANCE_LOGS: '/api/staff/tickets/maintenance-logs/me', // GH-44 #3
    MAINTENANCE_LOG_ITEM: (ticketId: string, logId: string) =>
      `/api/tickets/${ticketId}/maintenance-logs/${logId}`,        // GH-44 #4 — PATCH
  },
  NOTIFICATIONS: {
    MARK_OPENED: (id: string) => `/api/notifications/${id}/opened`,
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`, // PATCH — idempotent
    MARK_ALL_READ: '/api/notifications/read-all', // POST — body rỗng
    UNREAD_COUNT: '/api/notifications/unread-count', // GET — badge
  },
  DEVICE_TOKENS: {
    BASE: '/api/device-tokens',
  },
  NOTIFICATION_PREFERENCES: {
    BASE: '/api/notification-preferences',
  },
  KNOWLEDGE_BASE: {
    LIST:    '/api/knowledge-base',
    DETAIL:  (id: string) => `/api/knowledge-base/${id}`,
    HELPFUL: (id: string) => `/api/knowledge-base/${id}/helpful`,
    SUGGEST: '/api/knowledge-base/suggest', // GH-44 #7 — GET ?TicketId=
  },
  // GH-78 — Blog read-only. Public controller chỉ trả bài Published;
  // bài Draft/Archived → 404 (không phải 403). KHÔNG gửi param Status.
  BLOG: {
    LIST:   '/api/blog',                              // GET ?PageNumber&PageSize&Origin
    DETAIL: (id: string) => `/api/blog/${id}`,
  },
  KB_REFERENCES: {
    LIST: '/api/knowledge-base/references',                          // GET ?ticketId= + POST
    ITEM: (refId: string) => `/api/knowledge-base/references/${refId}`, // GH-44 #6 — DELETE
  },
  BATTERY_TYPES: {
    LIST:   '/api/battery-types',                              // GET ?pageNumber&pageSize&keyword&includeDeleted
    DETAIL: (id: string) => `/api/battery-types/${id}`,        // GH-56 — read-only cho Staff
  },
  IOT_DEVICES: {
    // GH-56 — cầu nối deviceCode (mã in trên thiết bị) → id (GUID) cho Staff/Manager
    BY_CODE:          (deviceCode: string) => `/api/iot-devices/by-code/${deviceCode}`,
    CALIBRATIONS:     (deviceId: string) => `/api/iot-devices/${deviceId}/calibrations`,           // GET ?channel&includeExpired + POST
    CALIBRATION_ITEM: (deviceId: string, calibrationId: string) =>
      `/api/iot-devices/${deviceId}/calibrations/${calibrationId}`,                                // DELETE
  },
} as const;
