export const ENDPOINTS = {
  AUTH: {
    LOGIN:             '/api/auth/login',
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
  BATTERIES: {
    LIST:   '/api/batteries',
    DETAIL: (id: string) => `/api/batteries/${id}`,
  },
  TICKETS: {
    LIST:   '/api/tickets',
    DETAIL: (id: string) => `/api/tickets/${id}`,
    CREATE: '/api/tickets',
  },
} as const;
