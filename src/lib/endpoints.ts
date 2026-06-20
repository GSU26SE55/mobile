export const ENDPOINTS = {
  AUTH: {
    LOGIN:             '/api/auth/login',
    LOGIN_VERIFY_2FA:  '/api/auth/login/verify-2fa', // GH-295 — bước 2 của 2FA login
    LOGIN_2FA_SMS:     '/api/auth/login/2fa/sms',    // #AUTH-58 — gửi OTP qua SMS (fallback)
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
    MY:       '/api/battery-assets/me',
    DETAIL:   (id: string) => `/api/battery-assets/${id}`,
    REALTIME: (id: string) => `/api/battery-assets/${id}/realtime`,
  },
  SENSOR_READINGS: {
    LATEST:    (assetId: string) => `/api/sensor-readings/${assetId}/latest`,
    HISTORY:   (assetId: string) => `/api/sensor-readings/${assetId}/history`,
    AGGREGATE: (assetId: string) => `/api/sensor-readings/${assetId}/aggregate`,
  },
  ALERTS: {
    LIST:        '/api/alerts',
    DETAIL:      (id: string) => `/api/alerts/${id}`,
    ACKNOWLEDGE: (id: string) => `/api/alerts/${id}/acknowledge`,
  },
  TICKETS: {
    CUSTOMER_LIST:   '/api/customer/tickets/me',
    CUSTOMER_CREATE: '/api/customer/tickets',
    DETAIL:          (id: string) => `/api/tickets/${id}`,
    COMMENT:         (id: string) => `/api/tickets/${id}/comments`,
    REOPEN:          (id: string) => `/api/customer/tickets/${id}/reopen`,
    RATE:            (id: string) => `/api/customer/tickets/${id}/rate`,
  },
  STAFF: {
    ME: '/api/auth/me',
  },
  STAFF_TICKETS: {
    MY_LIST:          '/api/staff/tickets/me',
    START:            (id: string) => `/api/staff/tickets/${id}/start`,
    HOLD:             (id: string) => `/api/staff/tickets/${id}/hold`,
    RESUME:           (id: string) => `/api/staff/tickets/${id}/resume`,
    RESOLVE:          (id: string) => `/api/staff/tickets/${id}/resolve`,
    ESCALATE_REQUEST: (id: string) => `/api/staff/tickets/${id}/escalate-request`,
    MAINTENANCE_LOG:  (id: string) => `/api/tickets/${id}/maintenance-logs`,
  },
  NOTIFICATIONS: {
    LIST: '/api/notifications',
  },
  DEVICE_TOKENS: {
    BASE: '/api/device-tokens',
  },
  KNOWLEDGE_BASE: {
    LIST:    '/api/knowledge-base',
    DETAIL:  (id: string) => `/api/knowledge-base/${id}`,
    HELPFUL: (id: string) => `/api/knowledge-base/${id}/helpful`,
  },
  KB_REFERENCES: {
    LIST: '/api/knowledge-base/references', // GET ?ticketId=
  },
} as const;
