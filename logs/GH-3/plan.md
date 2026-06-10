# Plan — GH-3: [Mobile] Flow Authentication

## Metadata
- **Status:** REVIEWING | **Role:** Mobile | **Ngày:** 2026-06-09
- **Issue:** #3 — https://github.com/GSU26SE55/mobile/issues/3
- **Sprint:** Sprint 1 (deadline 2026-05-30)

## Mục tiêu
Thiết lập toàn bộ nền tảng project (axios, SecureStore, Zustand session, AuthContext) và implement đầy đủ auth flow cho **Customer** (Login · Register · OTP verify · Forgot Password) và **Staff** (Login · Forgot Password). Đây là ticket nền tảng Sprint 1 — các feature sau (battery, ticket, notification) đều phụ thuộc vào kết quả này.

## Scope
**Trong scope:**
- Package setup: `@tanstack/react-query`, `zustand`, `axios`, `jwt-decode` (expo-secure-store đã có trong Expo SDK)
- Project structure: tạo `src/` directory theo mobile rules
- Shared infra: `src/lib/axios.ts`, `src/lib/secureStore.ts`, `src/lib/endpoints.ts`, `src/lib/queryKeys.ts`
- Session: `src/stores/sessionStore.ts` (Zustand), `src/types/session.types.ts`, `src/types/api.types.ts`
- AuthContext + hydration 3-case logic
- Auth guard bằng `useSegments` + `useRouter` (Expo Router pattern)
- Auth flow Customer: Login · Register · OTP verify · Forgot Password (3 bước)
- Auth flow Staff: Login · Forgot Password (3 bước)  — *không có Register (Staff được Admin invite)*
- Root layout: `app/_layout.tsx` (QueryClient + AuthProvider)
- `app/index.tsx`: redirect by role sau hydration
- Auth screens: `app/(auth)/login.tsx` · `register.tsx` · `verify-otp.tsx` · `forgot-password.tsx`
- Customer layout guard: `app/(customer)/_layout.tsx` (check role CUSTOMER)
- Staff layout guard: `app/(staff)/_layout.tsx` (check role STAFF)
- Staff home placeholder: `app/(staff)/index.tsx`

**Ngoài scope:**
- Google OAuth (Mobile dùng email/password, không cần OAuth)
- Accept invite (Staff accept qua email link → web app, không cần implement ở mobile)
- Avatar upload
- Profile management (`PUT /api/auth/me/profile`)
- Battery, Ticket, Notification screens (ticket riêng)
- Admin / Manager (block khi login — 2 role này dùng web app)

## Packages cần cài
```bash
npx expo install expo-secure-store
npm install @tanstack/react-query zustand axios jwt-decode
```

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `package.json` | modify | Thêm packages bên trên |
| `app/_layout.tsx` | modify | Thêm QueryClient + AuthProvider; xoá (tabs) boilerplate |
| `app/index.tsx` | modify | Redirect by role sau hydration |
| `app/(auth)/_layout.tsx` | create | Stack Navigator cho auth group |
| `app/(auth)/login.tsx` | create | Login screen (Customer + Staff) |
| `app/(auth)/register.tsx` | create | Register screen (Customer only) |
| `app/(auth)/verify-otp.tsx` | create | OTP 6 chữ số + resend countdown |
| `app/(auth)/forgot-password.tsx` | create | Multi-step: step 1/2/3 local state |
| `app/(customer)/_layout.tsx` | create | Tab navigator + role guard (CUSTOMER) |
| `app/(customer)/dashboard.tsx` | create | Placeholder |
| `app/(staff)/_layout.tsx` | create | Stack navigator + role guard (STAFF) |
| `app/(staff)/index.tsx` | create | Placeholder |
| `src/types/api.types.ts` | create | `CommonResponse<T>`, `ErrorEntity` |
| `src/types/session.types.ts` | create | `UserRole`, `SessionUser`, `JwtPayload`, `decodeToken`, `redirectByRole` |
| `src/lib/secureStore.ts` | create | Wrapper expo-secure-store: `getToken`, `setToken`, `clearToken`, `saveTokens`, `clearTokens`, `isTokenExpired` |
| `src/lib/axios.ts` | create | Axios instance + attach token (async) + refresh interceptor + double-refresh guard |
| `src/lib/endpoints.ts` | create | `ENDPOINTS` object — single source of truth |
| `src/lib/queryKeys.ts` | create | `KEY` + `QUERY_KEY` skeleton |
| `src/stores/sessionStore.ts` | create | Zustand: `user`, `setSession`, `clearSession` |
| `src/context/authContext.tsx` | create | `AuthProvider`: `isHydrating` + 3-case boot logic — tạo thư mục `src/context/` |
| `src/hooks/useAuthGuard.ts` | create | `useSegments` + `useRouter` — redirect nếu auth state không khớp segment — tạo thư mục `src/hooks/` |
| `src/features/auth/types/auth.types.ts` | create | Payloads + Response types |
| `src/features/auth/services/auth.service.ts` | create | Tất cả auth API calls |
| `src/features/auth/hooks/useLogin.ts` | create | `useMutation` |
| `src/features/auth/hooks/useLogout.ts` | create | `useMutation` |
| `src/features/auth/hooks/useRegister.ts` | create | `useMutation` |
| `src/features/auth/hooks/useVerifyOtp.ts` | create | `useMutation` |
| `src/features/auth/hooks/useResendOtp.ts` | create | `useMutation` |
| `src/features/auth/hooks/useForgotPassword.ts` | create | `useMutation` |
| `src/features/auth/hooks/useVerifyResetOtp.ts` | create | `useMutation` |
| `src/features/auth/hooks/useResendResetOtp.ts` | create | `useMutation` |
| `src/features/auth/hooks/useResetPassword.ts` | create | `useMutation` |
| `src/features/auth/components/LoginForm.tsx` | create | email + password + nút đăng nhập |
| `src/features/auth/components/RegisterForm.tsx` | create | fullName + email + password + phone |
| `src/features/auth/components/OtpVerifyForm.tsx` | create | 6-digit input + resend countdown |
| `src/features/auth/components/ForgotPasswordStep1.tsx` | create | Nhập email |
| `src/features/auth/components/ForgotPasswordStep2.tsx` | create | OTP + resend — Props: `{ email, onSuccess }` (không có onExpired) |
| `src/features/auth/components/ForgotPasswordStep3.tsx` | create | Mật khẩu mới |

## Enums

> **Note (thêm sau khi SHIPPED):** Plan gốc define `UserRole` inline trong `src/types/session.types.ts` — codebase thực tế đã tách ra `src/shared/enums/session.enum.ts` với `as const` pattern.

| Enum | File |
|------|------|
| `UserRole` | `src/shared/enums/session.enum.ts` |

`src/types/session.types.ts` re-export `UserRole` từ `shared/enums/session.enum`.

## Types

```ts
// src/types/session.types.ts
export const UserRole = {
  ADMIN:    'ADMIN',
  MANAGER:  'MANAGER',
  STAFF:    'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

interface SessionUser {
  accountId: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: string[];  // từ JWT.perm[] — confirmed từ GH-11 BE contract
}

// JWT claim names — confirmed từ GH-11 (SHIPPED + đã verify với BE):
// AccountId → PascalCase key, FullName → PascalCase key
// role → lowercase key, PascalCase value ("Customer")
// perm → lowercase key, string array (["ticket.create", "battery.view", ...])
interface JwtPayload {
  AccountId: string;   // PascalCase key — BE đặt tên này
  email: string;
  FullName: string;    // PascalCase key — BE đặt tên này
  role: string;        // lowercase key, PascalCase value → .toUpperCase() khi map
  perm: string[];      // lowercase key — permissions array từ BE
  exp: number;
}

export const decodeToken = (token: string): SessionUser => {
  const p = jwtDecode<JwtPayload>(token);
  return {
    accountId:   p.AccountId,
    email:       p.email,
    fullName:    p.FullName,
    role:        p.role.toUpperCase() as UserRole,  // "Customer" → "CUSTOMER"
    permissions: p.perm ?? [],  // fallback [] nếu BE chưa gửi claim này
  };
};

// Redirect sau login — block Admin/Manager khỏi mobile
export const redirectByRole = (role: UserRole): string | null => ({
  CUSTOMER: '/(customer)/(tabs)/dashboard',
  STAFF:    '/(staff)/',
  ADMIN:    null,
  MANAGER:  null,
} as Record<UserRole, string | null>)[role] ?? null;

// src/types/api.types.ts
interface CommonResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message?: string;
  data: T | null;
  listErrors: { field: string; detail: string }[];
}
```

```ts
// src/features/auth/types/auth.types.ts
interface LoginPayload          { email: string; password: string; }
interface RegisterPayload       { fullName: string; email: string; password: string; phoneNumber?: string; dateOfBirth?: string; address?: string; }
interface RegisterResponseData { email: string; otpExpiresInSeconds: number; }  // ← countdown cho OTP verify sau register
interface OtpVerifyPayload      { email: string; otp: string; }
interface ResendOtpPayload      { email: string; }
interface ForgotPasswordPayload { email: string; }
interface VerifyResetOtpPayload { email: string; otp: string; }
interface ResetPasswordPayload  { resetToken: string; newPassword: string; }
interface LoginResponseData     { accessToken: string; refreshToken: string; }
interface VerifyResetOtpData    { resetToken: string; expiresInSeconds: number; }
```

## Form Validation
Dùng **Zod** (`schema.safeParse()`) — nhất quán với Web, đã có trong `tech/mobile.md`. Không dùng React Hook Form (thiết kế cho web DOM). Schemas đặt trong `src/features/auth/schemas/`:
```ts
// Ví dụ — login.schema.ts
const loginSchema = z.object({
  email:    z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
});

// Dùng trong form handler
const result = loginSchema.safeParse({ email: email.trim(), password });
if (!result.success) {
  // map result.error.flatten().fieldErrors → setFieldErrors
  return;
}
await mutateAsync(result.data);
```
Validation rules tuân theo API contract: email max 256, password 8–100 ký tự có chữ hoa/thường/số/ký tự đặc biệt, OTP đúng 6 chữ số.

## Endpoints

| Method | Path | Dùng bởi |
|--------|------|----------|
| POST | `/api/auth/login` | Customer + Staff |
| POST | `/api/auth/register` | Customer | Response: `CommonResponse<RegisterResponseData>` — `{ email, otpExpiresInSeconds }` |
| POST | `/api/auth/verify-otp` | Customer |
| POST | `/api/auth/resend-otp` | Customer |
| POST | `/api/auth/forgot-password` | Customer + Staff |
| POST | `/api/auth/verify-reset-otp` | Customer + Staff |
| POST | `/api/auth/resend-reset-otp` | Customer + Staff |
| POST | `/api/auth/reset-password` | Customer + Staff |
| POST | `/api/auth/refresh-token` | Interceptor |
| POST | `/api/auth/logout` | Both |

## Approach

**Token storage — `expo-secure-store` (KHÔNG dùng AsyncStorage):**
```ts
// src/lib/secureStore.ts
import * as SecureStore from 'expo-secure-store';

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await Promise.all([
    SecureStore.setItemAsync('accessToken', accessToken),
    SecureStore.setItemAsync('refreshToken', refreshToken),
  ]);
};
export const clearTokens = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync('accessToken'),
    SecureStore.deleteItemAsync('refreshToken'),
  ]);
};
export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= exp * 1000 - 30_000; // 30s clock skew buffer
  } catch { return true; }
};
```

**Session hydration — 3 cases (async, vì SecureStore là async):**
```
App boot → AuthContext: isHydrating = true → đọc SecureStore

Case 1: CÓ accessToken + CHƯA hết hạn
  → decodeToken → setSession → isHydrating = false ✅

Case 2: KHÔNG có refreshToken
  → clearSession → isHydrating = false → app/index.tsx redirect /login

Case 3: CÓ refreshToken, access thiếu hoặc hết hạn
  → POST /api/auth/refresh-token
      → OK:   saveTokens → decode → setSession → isHydrating = false ✅
      → fail: clearTokens → clearSession → isHydrating = false → /login
```

**Auth guard — Expo Router pattern (`useSegments` + `useRouter`):**
```ts
// src/hooks/useAuthGuard.ts
export function useAuthGuard() {
  const { user, isHydrating } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isHydrating) return;  // chờ hydration xong
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      const dest = redirectByRole(user.role);
      if (!dest) {
        // Admin/Manager dùng web app — clearTokens là async, dùng IIFE tránh dangling promise
        void (async () => {
          await clearTokens();
          clearSession();
          Alert.alert('Không hỗ trợ', 'Tài khoản này vui lòng dùng Web App.');
        })();
        return;
      }
      router.replace(dest);
    }
  }, [user, isHydrating, segments]);
}
// Gọi useAuthGuard() trong app/_layout.tsx
```

**Axios interceptor (async — khác web vì SecureStore là async):**
```ts
// PUBLIC_ENDPOINTS — skip token attachment cho auth endpoints
// (tránh tryRefresh() bị gọi khi chưa có token → navigate về login trong khi đang login)
const PUBLIC_ENDPOINTS = new Set([
  ENDPOINTS.AUTH.LOGIN, ENDPOINTS.AUTH.REGISTER, ENDPOINTS.AUTH.VERIFY_OTP,
  ENDPOINTS.AUTH.RESEND_OTP, ENDPOINTS.AUTH.FORGOT_PASSWORD,
  ENDPOINTS.AUTH.VERIFY_RESET_OTP, ENDPOINTS.AUTH.RESEND_RESET_OTP,
  ENDPOINTS.AUTH.RESET_PASSWORD, ENDPOINTS.AUTH.REFRESH_TOKEN,
]);

// request interceptor: attach Bearer
instance.interceptors.request.use(async config => {
  const url = config.url ?? '';
  if ([...PUBLIC_ENDPOINTS].some(ep => url.endsWith(ep))) return config;

  const token = await getAccessToken();
  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    const newToken = await tryRefresh();
    if (newToken) config.headers.Authorization = `Bearer ${newToken}`;
  }
  return config;
});

// response interceptor: handle 401
instance.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retried) {
      err.config._retried = true;
      const newToken = await tryRefresh();
      if (newToken) {
        err.config.headers.Authorization = `Bearer ${newToken}`;
        return instance(err.config);
      }
    }
    return Promise.reject(err);
  }
);
```

**Forgot Password multi-step (single screen, local state):**
```
Step 1: email → POST /forgot-password → lưu email trong state → next
Step 2: OTP → POST /verify-reset-otp → nhận { resetToken, expiresInSeconds } → next
Step 3: mật khẩu mới → POST /reset-password (resetToken) → navigate /(auth)/login + Alert thành công
// expiresInSeconds từ response step 2 — hiển thị countdown, hết giờ → Alert + reset về step 1
```

**Register → OTP verify — truyền `otpExpiresInSeconds` qua Expo Router params:**
```ts
// useRegister onSuccess: router.push({ pathname: '/(auth)/verify-otp', params: { email, otpExpiresInSeconds: String(data.otpExpiresInSeconds) } })
// OtpVerifyForm dùng otpExpiresInSeconds để hiển thị countdown
// Nếu param thiếu → fallback: không show countdown (resend button luôn hiện)
```

**OTP verify — nhận email + otpExpiresInSeconds qua Expo Router params:**
```ts
// app/(auth)/verify-otp.tsx
const { email, otpExpiresInSeconds } = useLocalSearchParams<{ email: string; otpExpiresInSeconds?: string }>();
if (!email) router.replace('/(auth)/register');
```

**Login success — block Admin/Manager:**
```ts
// useLogin onSuccess
const dest = redirectByRole(user.role);
if (!dest) {
  Alert.alert('Không hỗ trợ', 'Tài khoản Admin/Manager vui lòng dùng Web App.');
  await clearTokens();
  clearSession();
  return;
}
router.replace(dest);
```

## Edge Cases
- **isHydrating = true:** `app/index.tsx`, `(customer)/_layout.tsx`, `(staff)/_layout.tsx` đều hiển thị `<ActivityIndicator />`, không redirect — tránh flash khi Expo Router mount layout trước khi SecureStore đọc xong (deep link / route restore)
- **Admin/Manager login:** block ngay trong `useLogin onSuccess` + clear tokens + Alert
- **SecureStore lỗi (thiết bị không support):** catch + fallback clearTokens + redirect login
- **Double refresh:** `isRefreshing` flag + pending queue (giống web), timeout 10s
- **OTP 429:** disable nút Gửi lại + countdown 60s
- **verify-otp navigate trực tiếp (không có email param):** redirect về /register
- **resetToken hết hạn (step 3):** countdown theo `expiresInSeconds`, hết → Alert + reset step 1
- **Staff login:** redirect `/(staff)/` — không có Register option trên màn hình Login (chỉ Customer)

## Success Criteria
| Tiêu chí | Cách verify |
|----------|------------|
| Customer login → redirect `/(customer)/dashboard` | Manual test |
| Staff login → redirect `/(staff)/` | Manual test |
| Admin login → Alert + block (không vào app) | Manual test |
| Customer register → OTP email → verify → redirect login | Manual test |
| Forgot password 3 bước → thành công → redirect login | Manual test |
| Token refresh tự động khi access hết hạn | Đợi token expire, gọi API |
| `tsc --noEmit` 0 lỗi | `npm run tsc --noEmit` |
| ESLint 0 warning | `npm run lint` |

## Steps
- [x] Bước 1: Cài packages (`@tanstack/react-query`, `zustand`, `axios`, `jwt-decode`, `expo-secure-store`) — 2026-05-29
- [x] Bước 2: Tạo `src/types/api.types.ts` + `src/types/session.types.ts` (UserRole, SessionUser, JwtPayload, decodeToken, redirectByRole) — 2026-05-29
- [x] Bước 3: Tạo `src/lib/secureStore.ts` (getToken, setToken, clearToken, saveTokens, clearTokens, isTokenExpired) — 2026-05-29
- [x] Bước 4: Tạo `src/lib/endpoints.ts` (ENDPOINTS object) — 2026-05-29
- [x] Bước 5: Tạo `src/lib/queryKeys.ts` (KEY + QUERY_KEY skeleton) — 2026-05-29
- [x] Bước 6: Tạo `src/stores/sessionStore.ts` (Zustand: user, setSession, clearSession) — 2026-05-29
- [x] Bước 7: Tạo `src/lib/axios.ts` (instance + async interceptors + tryRefresh queue + timeout 10s) — 2026-05-29
- [x] Bước 8: Tạo `src/context/authContext.tsx` (isHydrating + 3-case boot logic với SecureStore async) — 2026-05-29
- [x] Bước 9: Tạo `src/hooks/useAuthGuard.ts` (useSegments + useRouter redirect logic) — 2026-05-29
- [x] Bước 10: Tạo `src/features/auth/types/auth.types.ts` (tất cả payloads + response types) — 2026-05-29
- [x] Bước 11: Tạo `src/features/auth/services/auth.service.ts` (tất cả auth API calls) — 2026-05-29
- [x] Bước 12: Tạo tất cả hooks (useLogin, useLogout, useRegister, useVerifyOtp, useResendOtp, useForgotPassword, useVerifyResetOtp, useResendResetOtp, useResetPassword) — 2026-05-29
- [x] Bước 13: Tạo auth components (LoginForm, RegisterForm, OtpVerifyForm, ForgotPasswordStep1/2/3) — 2026-05-29
- [x] Bước 14: Tạo auth screens (login.tsx, register.tsx, verify-otp.tsx, forgot-password.tsx) + layouts — 2026-05-29
- [x] Bước 15: Rewrite `app/_layout.tsx` (QueryClient + AuthProvider + useAuthGuard) + `app/index.tsx` (redirect by role) — 2026-05-29
- [x] Bước 16: Tạo `app/(customer)/_layout.tsx` (placeholder Tab, role guard) + `app/(customer)/dashboard.tsx` — 2026-05-29
- [x] Bước 17: Tạo `app/(staff)/_layout.tsx` (Stack, role guard) + `app/(staff)/index.tsx` — 2026-05-29
- [x] Bước 18: `tsc --noEmit` + `eslint --max-warnings=0` → PASS — 2026-05-29

## Câu hỏi đã giải đáp
- **Staff có dùng mobile không?** → Có (user xác nhận: "customer và staff")
- **Google OAuth có cần không?** → Không — mobile dùng email/password
- **Staff có Register không?** → Không — Staff được Admin invite qua email (web app), mobile chỉ cần Login + Forgot Password cho Staff
- **Admin/Manager login vào mobile?** → Block — async IIFE clearTokens() + Alert + clearSession()
- **Token storage?** → `expo-secure-store` (không AsyncStorage theo mobile rules)
- **JwtPayload claim names?** → Xác nhận từ GH-11 (SHIPPED + confirmed BE): `AccountId` (PascalCase key), `FullName` (PascalCase key), `role` (lowercase key, value PascalCase "Customer"), `perm` (lowercase key, string[])
- **perm[] có trong JWT không?** → Có — confirmed GH-11. Fallback `?? []` nếu claim thiếu
- **Form validation?** → Native validation (controlled state), không dùng Zod (không có trong mobile stack)
- **src/context/ và src/hooks/ có trong mobile.md không?** → Không list sẵn nhưng cần tạo — thêm vào Files table
- **Reference plan?** → GH-11 FE (SHIPPED) — adapt patterns cho Expo Router + SecureStore
