export const ENDPOINTS = {
  AUTH: {
    LOGIN:             '/api/auth/login',
    GOOGLE:            '/api/auth/google',            // Google login — mobile sends idToken (native Google Sign-In)
    LOGIN_VERIFY_2FA:  '/api/auth/login/verify-2fa', // GH-295 — step 2 of 2FA login
    LOGIN_2FA_SMS:     '/api/auth/login/2fa/sms',    // #AUTH-58 — send OTP via SMS (fallback)
    TWO_FA_CROSS_DEVICE_REQUEST: '/api/auth/2fa/cross-device-confirm/request', // #AUTH-51 — Device A sends the request
    TWO_FA_CROSS_DEVICE_CONFIRM: '/api/auth/2fa/cross-device-confirm',         // #AUTH-51 — Device B confirms
    REACTIVATE_REQUEST:'/api/auth/reactivate-request', // #AUTH-50 — step 1 of account recovery
    REACTIVATE_VERIFY: '/api/auth/reactivate-verify',  // #AUTH-50 — step 2 of account recovery
    REGISTER:          '/api/auth/register',
    VERIFY_OTP:        '/api/auth/verify-otp',
    RESEND_OTP:        '/api/auth/resend-otp',
    FORGOT_PASSWORD:   '/api/auth/forgot-password',
    VERIFY_RESET_OTP:  '/api/auth/verify-reset-otp',
    RESEND_RESET_OTP:  '/api/auth/resend-reset-otp',
    RESET_PASSWORD:    '/api/auth/reset-password',
    REFRESH_TOKEN:     '/api/auth/refresh-token',
    LOGOUT:            '/api/auth/logout',
    ME_PERMISSIONS:    '/api/auth/me/permissions', // GH-47 — fresh permissions for the current role
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
    // GH-295: 2-step 2FA flow. The old /enable now returns 410 Gone — do not use.
    INIT_2FA:             '/api/accounts/me/2fa/init',
    CONFIRM_2FA:          '/api/accounts/me/2fa/confirm',
    DISABLE_2FA:          '/api/accounts/me/2fa/disable',
    BACKUP_REGEN_2FA:     '/api/accounts/me/2fa/backup-codes/regenerate',
    LINK_GOOGLE:          '/api/accounts/me/link-google',
    UNLINK_GOOGLE:        '/api/accounts/me/unlink-google',
    DEACTIVATE:           '/api/accounts/me/deactivate',
    DELETE:               '/api/accounts/me',
    LOGIN_HISTORY:        '/api/accounts/me/login-history', // #AUTH-62 — login history
    // #AUTH-48 — trusted devices (GET list + DELETE all share this path; DELETE 1 uses TRUSTED_DEVICE)
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
    // Nhật ký bảo trì định kỳ ở tầng tài sản (khác maintenance log của ticket).
    MAINTENANCE_CYCLES: (id: string) => `/api/battery-assets/${id}/maintenance-cycles`,
    MY:           '/api/battery-assets/me',
    DETAIL:       (id: string) => `/api/battery-assets/${id}`,
    REALTIME:     (id: string) => `/api/battery-assets/${id}/realtime`,
    CASCADE_RISK: (id: string) => `/api/battery-assets/${id}/cascade-risk`, // GH-57 (Sprint 7 B4)
    BMS_SWITCH:   (id: string) => `/api/battery-assets/${id}/bms-switch`,
  },
  SENSOR_READINGS: {
    LATEST:    (assetId: string) => `/api/sensor-readings/${assetId}/latest`,
    HISTORY:   (assetId: string) => `/api/sensor-readings/${assetId}/history`,
    AGGREGATE: (assetId: string) => `/api/sensor-readings/${assetId}/aggregate`,
    // GH-74 (NS-06 #650) — fixed 1h bucket from TimescaleDB continuous aggregate.
    // Same response shape as AGGREGATE but does NOT accept `interval`. Used for long ranges.
    AGGREGATE_HOURLY: (assetId: string) => `/api/sensor-readings/${assetId}/aggregate/hourly`,
    // GH-57 — SSE telemetry live stream (docs/battery-realtime-description.md §3).
    // Static path; the hook builds BASE_URL + ?scope=&access_token= itself. Do NOT call via axios.
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
    THRESHOLD_BY_SITE: (siteId: string) => `/api/ambient/threshold-configs/by-site/${siteId}`,
  },
  REPORTS: {
    AMBIENT_TREND: '/api/reports/ambient-trend', // ?siteId=&from=&to=&granularity=
  },
  ALERTS: {
    LIST:        '/api/alerts',
    DETAIL:      (id: string) => `/api/alerts/${id}`,
    ACKNOWLEDGE: (id: string) => `/api/alerts/${id}/acknowledge`,
    RESOLVE:     (id: string) => `/api/alerts/${id}/resolve`, // GH-55 — PATCH, Staff-only only
  },
  ENVIRONMENTAL_INCIDENTS: {
    LIST:        '/api/environmental-incidents',                                   // GET ?siteId&status&incidentType&from&to&pageSize
    DETAIL:      (id: string) => `/api/environmental-incidents/${id}`,
    ACKNOWLEDGE: (id: string) => `/api/environmental-incidents/${id}/acknowledge`, // POST, Staff-only
    RESOLVE:     (id: string) => `/api/environmental-incidents/${id}/resolve`,     // POST { resolutionNote }, Staff-only
    BY_SITE_ACTIVE: (siteId: string) => `/api/environmental-incidents/by-site/${siteId}/active`, // GH-68 — GET Open+Acknowledged in 1 call
  },
  TICKETS: {
    CUSTOMER_LIST:   '/api/customer/tickets/me',
    CUSTOMER_CREATE: '/api/customer/tickets',
    DETAIL:          (id: string) => `/api/tickets/${id}`,
    // KB articles ranked by AI for this ticket — READ-ONLY, not auto-attached.
    // Access: Manager/Admin, or an ASSIGNED Staff member (either PrimaryHandler or Supporter).
    // Mobile only needs the KB view: Manager triage (staff-suggestions) is done on web.
    KB_SUGGESTIONS:  (id: string) => `/api/tickets/${id}/kb-suggestions`,
    PARTICIPANTS:    (id: string) => `/api/tickets/${id}/participants`,
    CHATS:           (id: string) => `/api/tickets/${id}/chats`,   // GET list (?page&pageSize) + POST (BE migration 20260622)
    CHAT_DETAIL:     (tid: string, cid: string) => `/api/tickets/${tid}/chats/${cid}`, // PUT (edit) / DELETE
    // DELETE { chatIds } — max 50 per call, partial success. BE returns 400 when the ticket is
    // Closed tickets. Chats not owned by the author are HIDDEN INDIVIDUALLY (TicketChatHide)
    // rather than deleted, and do NOT appear in the response's `deleted`/`skipped`.
    CHAT_BULK_DELETE: (tid: string) => `/api/tickets/${tid}/chats/bulk`,
    CHAT_MARK_READ:  (tid: string) => `/api/tickets/${tid}/chats/mark-read`, // POST { chatIds }
    CHAT_TRANSLATE:  (tid: string, cid: string) => `/api/tickets/${tid}/chats/${cid}/translate`, // POST ?to=
    CHAT_VOICE:      (tid: string) => `/api/tickets/${tid}/chats/voice`, // POST JSON ChatAttachmentInput (audio file already uploaded to FileStorage)
    // GH-83 — retry speech-to-text conversion. POST, no body, returns 202 (BE handles it asynchronously).
    // 409 if the chat isn't in Failed state; 404 if the chat doesn't belong to the ticket.
    CHAT_VOICE_RETRY: (tid: string, chatId: string) =>
      `/api/tickets/${tid}/chats/${chatId}/voice/retry`,
    // GH-68 — any role
    CHATS_CURSOR:        (tid: string) => `/api/tickets/${tid}/chats/cursor`,        // GET ?cursor&limit(≤100,def20)
    CHAT_UNREAD_COUNT:   (tid: string) => `/api/tickets/${tid}/chats/unread-count`,  // GET → { unreadCount } (per-ticket, NOT bulk — ≠ NOTIFICATIONS.UNREAD_COUNT)
    CHAT_READERS:    (tid: string, cid: string) => `/api/tickets/${tid}/chats/${cid}/readers`, // GET → ChatReaderDTO[]; Staff/Manager/Admin ONLY (Customer gets 403)
    CHAT_REACTIONS:      (tid: string, cid: string) => `/api/tickets/${tid}/chats/${cid}/reactions`, // POST { reactionType } / DELETE ?type=
    CHAT_ATTACHMENT_DOWNLOAD: (tid: string, cid: string, fileId: string) =>
      `/api/tickets/${tid}/chats/${cid}/attachments/${fileId}/download`,             // GET → CommonResponse<string> URL; HTTP 200/202/451/404. {attachmentId}=FileId
    // GH-67 — Staff/Manager/Admin chat actions
    CHAT_PIN:        (tid: string, cid: string) => `/api/tickets/${tid}/chats/${cid}/pin`, // POST pin / DELETE unpin
    CHAT_SUGGEST:    (tid: string) => `/api/tickets/${tid}/chats/suggest`,        // POST { intent } (AI)
    CHAT_SUMMARIZE:  (tid: string) => `/api/tickets/${tid}/chats/summarize`,      // POST (AI)
    ACTIVITIES:      (id: string) => `/api/tickets/${id}/activities`, // GH-44 — timeline
    REOPEN:          (id: string) => `/api/customer/tickets/${id}/reopen`,
    RATE:            (id: string) => `/api/customer/tickets/${id}/rate`,
  },
  // GH-68 — cross-ticket chat (any role)
  CHATS: {
    ME:              '/api/chats/me',                                        // GET ?page&pageSize → flat TicketChatDTO[]
    UNREAD_COUNT:    '/api/chats/unread-count',                             // GET → total unread chats (mentions included)
    // GET → [{ customerId, unreadCount }] — 1 call for the whole Customers screen.
    // A customer with no unread messages is simply ABSENT from the list (treat as 0).
    UNREAD_BY_CUSTOMER: '/api/chats/unread-count/by-customer',
    MENTIONS_ME:     '/api/chats/mentions/me',                              // GET ?page&pageSize
    ERASE_MY_DATA:   '/api/chats/erase-my-data',                           // POST → data is ALWAYS null; count is only in the message
  },
  PERMISSIONS: {
    CATALOG: '/api/permissions', // GH-68 — catalog of all permissions (any role); ?module
  },
  STAFF: {
    ME: '/api/auth/me',
  },
  STAFF_TICKETS: {
    MY_LIST:          '/api/staff/tickets/me',
    DASHBOARD_STATS:  '/api/staff/tickets/dashboard/stats', // GH-67 — KPI snapshot for the JWT's staff

    HOLD:             (id: string) => `/api/staff/tickets/${id}/hold`,
    RESUME:           (id: string) => `/api/staff/tickets/${id}/resume`,
    RESOLVE:          (id: string) => `/api/staff/tickets/${id}/complete`,
    ESCALATE_REQUEST: (id: string) => `/api/staff/tickets/${id}/escalate-request`,
    MAINTENANCE_LOG:  (id: string) => `/api/tickets/${id}/maintenance-logs`,
    MY_MAINTENANCE_LOGS: '/api/staff/tickets/maintenance-logs/me', // GH-44 #3
    MAINTENANCE_LOG_ITEM: (ticketId: string, logId: string) =>
      `/api/tickets/${ticketId}/maintenance-logs/${logId}`,        // GH-44 #4 — PATCH
  },
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`, // PATCH — idempotent
    // GH-83 — Sprint 6.3 NOTI3-14. PATCH, no body, idempotent. `Opened` OUTRANKS `Read`:
    // calling `/read` on a record already `Opened` leaves it at `Opened`, BE won't downgrade it.
    MARK_OPENED: (id: string) => `/api/notifications/${id}/opened`,
    MARK_ALL_READ: '/api/notifications/read-all', // POST — empty body
    UNREAD_COUNT: '/api/notifications/unread-count', // GET — badge
  },
  DEVICE_TOKENS: {
    BASE: '/api/device-tokens',
  },
  NOTIFICATION_PREFERENCES: {
    BASE: '/api/notification-preferences',
    // GH-83 — Sprint 6.3 NOTI3-04. MATRIX: GET (group × channel matrix) + PUT (patch a single row).
    MATRIX: '/api/notification-preferences/matrix',
    // Lookup table NotificationType → group. Do NOT duplicate this table on the client — a new type added there would drift.
    CATEGORIES: '/api/notification-preferences/categories',
  },
  KNOWLEDGE_BASE: {
    LIST:    '/api/knowledge-base',
    DETAIL:  (id: string) => `/api/knowledge-base/${id}`,
    HELPFUL: (id: string) => `/api/knowledge-base/${id}/helpful`,
    SUGGEST: '/api/knowledge-base/suggest', // GH-44 #7 — GET ?TicketId=
  },
  // GH-78 — Blog read-only. The public controller only returns Published posts;
  // Draft/Archived → 404 (not 403). Do NOT send a Status param.
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
    DETAIL: (id: string) => `/api/battery-types/${id}`,        // GH-56 — read-only for Staff
  },
  THRESHOLDS: {
    // Alert thresholds per battery type — Staff can read (only Admin can edit).
    // 404 = this battery type has no threshold configured yet, not an error.
    BY_TYPE: (batteryTypeId: string) => `/api/thresholds/by-type/${batteryTypeId}`,
  },
  IOT_DEVICES: {
    // GH-56 — bridges deviceCode (code printed on the device) → id (GUID) for Staff/Manager
    BY_CODE:          (deviceCode: string) => `/api/iot-devices/by-code/${deviceCode}`,
    CALIBRATIONS:     (deviceId: string) => `/api/iot-devices/${deviceId}/calibrations`,           // GET ?channel&includeExpired + POST
    CALIBRATION_ITEM: (deviceId: string, calibrationId: string) =>
      `/api/iot-devices/${deviceId}/calibrations/${calibrationId}`,                                // DELETE
    // IOT3-57 — danh sách thiết bị cho Staff (KHÔNG trả apiKey/mqttPassword; đường admin mới có)
    LIST:             '/api/iot-devices',
    // IOT3-58 — lịch sử heartbeat, phân trang theo CON TRỎ (không offset)
    HEARTBEATS:       (deviceId: string) => `/api/iot-devices/${deviceId}/heartbeats`,
    // Admin route, opened to Staff — trả full apiKey/QR/MQTT (xem lại được nhiều lần).
    ADMIN_DETAIL:     (deviceId: string) => `/api/admin/iot-devices/${deviceId}`,
    ROTATE_KEY:       (deviceId: string) => `/api/admin/iot-devices/${deviceId}/rotate-key`,
    ROTATE_MQTT:      (deviceId: string) => `/api/admin/iot-devices/${deviceId}/rotate-mqtt`,
  },
} as const;
