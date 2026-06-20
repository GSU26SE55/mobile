# Plan — GH-4: [Mobile] Profile & Account Management — Customer/Staff

## Metadata
- **Status:** REVIEWING → **NEEDS REWORK (GH-295)** | **Role:** Mobile | **Ngày:** 2026-05-31, cập nhật 2026-06-14
- **Issue:** #4 — https://github.com/GSU26SE55/mobile/issues/4
- **Sprint:** Sprint 2 (due: 2026-06-13)

---

## ⚠️ GH-295 Contract Update (2026-06-14) — SỬA TRƯỚC KHI FIX CODE

> **Đã đối chiếu codebase.** Flow 2FA cũ (1 bước `enable`) đã bị BE thay bằng 2 bước. `enable` cũ trả **410 Gone**.

### C0 — ⚙️ FileStorage (đối chiếu docs/api-filestorage.md + code, 2026-06-15)

- **Module hoá:** `src/lib/fileStorage.ts` đã được GH-25 gỡ → thay bằng `src/features/file-storage/` (service + hooks). Avatar upload dùng `useUploadFile`. Tham chiếu `fileStorageLib` bên dưới đã lỗi thời.
- **Upload Content-Type:** KHÔNG set `'multipart/form-data'` thủ công (thiếu boundary → BE không parse được). Dùng `Content-Type: undefined` để axios tự sinh boundary — đồng bộ frontend web. *(Khẳng định "set thủ công đúng cho RN" bản 2026-05-31 là SAI; đã sửa cả code lẫn plan.)*
- **Avatar download cần Bearer:** `<Image source={{ uri, headers: { Authorization } }}>` — đã đúng trong plan + code (`AvatarPicker`).

### C1 — 🔴 2FA enable flow CŨ đã chết → thay bằng init + confirm

- **Code (verified):** `account.service.ts:30` `enable2FA()` POST `/2fa/enable` body rỗng → BE trả **410 Gone**. `disable2FA()` body rỗng → BE yêu cầu `{ password, totpCode }`.
- **Thay bằng (doc/BE):**

| Endpoint mới | Body | Response data |
|---|---|---|
| `POST /api/accounts/me/2fa/init` | — | `{ secret, otpAuthUri, pendingToken }` |
| `POST /api/accounts/me/2fa/confirm` | `{ pendingToken, code }` | `{ enabled, backupCodes: string[8] }` (hiện 1 lần) |
| `POST /api/accounts/me/2fa/disable` | `{ password, totpCode }` | `Guid` |
| `POST /api/accounts/me/2fa/backup-codes/regenerate` | `{ totpCode }` | `{ backupCodes: string[8] }` |

- → `endpoints.ts`: thêm `INIT_2FA`, `CONFIRM_2FA`, `BACKUP_REGEN_2FA`; bỏ `ENABLE_2FA`.
- → `account.types.ts`: bỏ `TwoFAEnableResponse`, thêm `Init2faResponse {secret,otpAuthUri,pendingToken}`, `Confirm2faPayload`, `Confirm2faResponse {enabled,backupCodes}`, `Disable2faPayload {password,totpCode}`, `RegenBackupPayload {totpCode}`, `RegenBackupResponse {backupCodes}`.
- → `account.service.ts`: `init2FA / confirm2FA / disable2FA(payload) / regenerateBackupCodes`.
- → hooks: `useInit2FA`, `useConfirm2FA`, `useDisable2FA(payload)`, `useRegenerateBackupCodes`.
- → `TwoFASetup.tsx`: wizard init → nhập TOTP confirm → hiển thị 8 backup codes (bắt buộc "Đã lưu"); thêm form disable (password + totpCode) + regenerate (totpCode).

### C2 — ✅ Các endpoint khác (password, email change, phone, sessions) khớp doc — không đổi

### Liên quan GH-3
2FA login bước 2 (`/login/verify-2fa`) thuộc rework GH-3 C2 — không trùng GH-4.

## Mục tiêu
Implement màn hình Profile, Bảo mật tài khoản, và Quản lý phiên đăng nhập cho Customer. Bao gồm 12 endpoint thuộc Nhóm 2, 3, 4 trong `docs/api-auth.md` chưa được GH-3 cover. Thêm tab "Hồ sơ" vào Customer layout.

## Scope
**Trong scope:**
- Tab "Hồ sơ" trong `app/(customer)/_layout.tsx`
- Màn hình Profile: xem + chỉnh sửa thông tin cá nhân + avatar
- Màn hình Settings: đổi mật khẩu, đổi email (2 bước + OTP), xác thực SĐT, 2FA, deactivate, delete
- Màn hình Sessions: danh sách phiên, thu hồi từng phiên, đăng xuất tất cả
- FileStorageService upload (avatar flow) — service đặt trong `src/lib/` để tránh cross-feature import
- Cài thêm: `expo-image-picker`, `react-native-svg`, `react-native-qrcode-svg`

**Ngoài scope:**
- Staff navigation / profile screen (Staff dùng chung component qua header, ticket GH-4 chỉ scope Customer)
- Google OAuth link/unlink (GH-5)
- Login history (GH-5)
- Battery / Ticket / Notification screens

## Files

### Bước 1 — Packages (tất cả dùng `npx expo install` để đảm bảo version compat Expo SDK 51)
```bash
npx expo install expo-image-picker react-native-svg react-native-qrcode-svg
```

### Bước 2 — `src/lib/endpoints.ts` (modify)
Thêm vào object `ENDPOINTS`:
```ts
PROFILE: {
  ME:                '/api/auth/me',
  UPDATE:            '/api/auth/me/profile',
  AVATAR:            '/api/auth/me/avatar',
},
ACCOUNT: {
  CHANGE_PASSWORD:         '/api/accounts/me/password',
  CHANGE_EMAIL:            '/api/accounts/me/change-email',
  CONFIRM_EMAIL_CHANGE:    '/api/accounts/me/confirm-email-change',
  SEND_PHONE_OTP:          '/api/accounts/me/send-phone-otp',
  VERIFY_PHONE_OTP:        '/api/accounts/me/verify-phone-otp',
  // 2FA flow 2 bước (GH-295). /2fa/enable cũ đã 410 Gone — KHÔNG dùng.
  INIT_2FA:                '/api/accounts/me/2fa/init',
  CONFIRM_2FA:             '/api/accounts/me/2fa/confirm',
  DISABLE_2FA:             '/api/accounts/me/2fa/disable',
  BACKUP_REGEN_2FA:        '/api/accounts/me/2fa/backup-codes/regenerate',
  DEACTIVATE:              '/api/accounts/me/deactivate',
  DELETE:                  '/api/accounts/me',
},
SESSIONS: {
  ME:         '/api/sessions/me',
  REVOKE:     (id: string) => `/api/sessions/${id}`,
  REVOKE_ALL: '/api/sessions/revoke-all',
},
FILES: {
  UPLOAD: '/api/files/upload',
},
```

### Bước 3 — `src/lib/queryKeys.ts` (modify)
```ts
KEY.profile  = ['profile']
KEY.sessions = ['sessions']

QUERY_KEY.profile.me      = [...KEY.profile, 'me']
QUERY_KEY.sessions.list   = [...KEY.sessions, 'list']
```

### Bước 4 — Enums

> **Note (thêm sau khi SHIPPED):** Plan gốc ghi `AvatarSourceEnum`, `AccountStatusEnum`, `RefreshTokenStatus` vào cột Shape key của types file — codebase thực tế tách ra file enum riêng.

| Enum | File |
|------|------|
| `AccountStatusEnum`, `AvatarSourceEnum` | `src/features/profile/enums/profile.enum.ts` |
| `RefreshTokenStatus` | `src/features/account/enums/account.enum.ts` |

`types/*.ts` chỉ re-export từ `enums/` — không define inline.

### Bước 4 — Types
| File | Action | Shape key |
|------|--------|-----------|
| `src/features/profile/types/profile.types.ts` | create | AccountDto, AccountProfileDto, StaffProfileDto, UpdateProfilePayload — enums re-export từ `profile.enum.ts` |
| `src/features/account/types/account.types.ts` | create | ChangePasswordPayload, ChangeEmailPayload, ConfirmEmailChangePayload, PhoneOtpPayload, Init2faResponse, Confirm2faPayload/Response, Disable2faPayload, RegenBackupPayload/Response, SessionDto, RevokeAllPayload — enums re-export từ `account.enum.ts` |

**ChangePasswordPayload** — Swagger có đủ 3 fields:
```ts
interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;  // ← Swagger: bắt buộc gửi lên BE (khác với reset-password chỉ validate FE-side)
}
```

**AccountDto** — shape từ `docs/api-auth.md §AccountDto`:
```ts
interface AccountDto {
  id: string;
  email: string;
  phoneNumber: string | null;
  fullName: string;
  avatarUrl: string | null;        // legacy — KHÔNG dùng để render
  dateOfBirth: string | null;
  address: string | null;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  twoFactorEnabled: boolean;
  status: AccountStatusEnum;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  roleId: string;
  role: string;                    // PascalCase từ BE → .toUpperCase() khi cần compare
  roleAssignedAt: string | null;
  roleAssignedBy: string | null;
  profile: AccountProfileDto | null;
  staffProfile: StaffProfileDto | null;
  displayAvatarUrl: string | null; // dùng field này để render avatar
}
```

**AccountProfileDto** — shape từ `docs/api-auth.md §AccountProfileDto`:
```ts
interface AccountProfileDto {
  accountId: string;
  avatarFileId: string | null;
  externalAvatarUrl: string | null;
  avatarSource: AvatarSourceEnum;
  address: string | null;
  birthDate: string | null;
  timeZone: string | null;
}
```

**UpdateProfilePayload** — request body PUT /api/auth/me/profile:
```ts
interface UpdateProfilePayload {
  fullName: string;
  phoneNumber?: string;
  address?: string;
  birthDate?: string;   // ← tên field trong REQUEST là `birthDate` (không phải `dateOfBirth`)
  timeZone?: string;    // ← có trong Swagger UpdateMyProfileCommand
}
// ⚠️ Hai path khác nhau — KHÔNG nhầm lẫn:
// PUT /api/auth/me/profile  → UpdateMyProfileCommand { fullName, phoneNumber, address, birthDate, timeZone }  ← dùng cái này
// PUT /api/accounts/me/profile → UpdateAccountCommand { fullName, phoneNumber, avatarUrl, dateOfBirth, address } ← đây là admin endpoint
// AccountDto response (GET /api/auth/me) dùng `dateOfBirth` — khi pre-fill form: map account.profile?.birthDate → form.birthDate
```

**StaffProfileDto** — shape từ `docs/api-auth.md §StaffProfileDto`:
```ts
interface StaffProfileDto {
  accountId: string;
  employeeCode: string | null;
  department: string | null;
  maxConcurrentTickets: number;
  isAvailable: boolean;
  skillTier: number;               // ← StaffSkillTierEnum 1–3 (api-auth.md §Nhóm 6)
  notes: string | null;
  skills: StaffSkillDto[] | null;  // ← Swagger: nullable: true — luôn guard bằng `skills ?? []` khi render
}
interface StaffSkillDto {
  skillCode: string;
  skillLevel: number;
  certifiedUntil: string | null;
}
```

**2FA types (GH-295 — flow 2 bước)** — `docs/api-auth.md §/2fa/init, §/2fa/confirm, §/2fa/disable, §/2fa/backup-codes/regenerate`:
```ts
interface Init2faResponse    { secret: string; otpAuthUri: string; pendingToken: string; }  // bước 1
interface Confirm2faPayload  { pendingToken: string; code: string; }
interface Confirm2faResponse { enabled: boolean; backupCodes: string[]; }  // 8 codes — hiện 1 lần
interface Disable2faPayload  { password: string; totpCode: string; }       // BẮT BUỘC cả 2
interface RegenBackupPayload { totpCode: string; }
interface RegenBackupResponse { backupCodes: string[]; }  // 8 codes mới — hiện 1 lần
```

**SessionDto** — shape từ `docs/api-auth.md §SessionDto`:
```ts
interface SessionDto {
  id: string;
  issuedAt: string;
  expiredAt: string;
  status: RefreshTokenStatus;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  isCurrent: boolean;
}
```

### Bước 5 — Services
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/profile/services/profile.service.ts` | create | getMe, updateProfile, setAvatar |
| `src/features/account/services/account.service.ts` | create | changePassword, changeEmail, confirmEmailChange, sendPhoneOtp, verifyPhoneOtp, init2FA, confirm2FA, disable2FA(payload), regenerateBackupCodes, deactivate, deleteAccount |
| `src/features/account/services/session.service.ts` | create | getSessions, revokeSession, revokeAll |
| ~~`src/lib/fileStorage.ts`~~ → `src/features/file-storage/services/file-storage.service.ts` | create | uploadFile multipart. **GH-25 (2026-06-15): module hoá vào `features/file-storage/`, `src/lib/fileStorage.ts` đã xóa.** |

**Upload service** — multipart upload:

> ⚠️ **SUPERSEDED bởi GH-25 (2026-06-15):** `src/lib/fileStorage.ts` (`fileStorageLib`) đã được gỡ; toàn bộ logic FileStorage gom vào module chuẩn `src/features/file-storage/` (`fileStorageService` + hooks). Avatar upload giờ dùng `useUploadFile` từ module này. Khối dưới giữ lại để tham chiếu lịch sử — **không còn áp dụng.**

```ts
// ✅ RESOLVED (đối chiếu code 2026-06-14): tất cả route /api/* (gồm /api/files/*) đi qua
//    cùng API gateway base URL (EXPO_PUBLIC_API_URL). KHÔNG có service riêng port 4005,
//    KHÔNG cần axios instance riêng — dùng chung axiosInstance như frontend đã ship.
// ⚠️ FIX (2026-06-15): KHÔNG set 'Content-Type': 'multipart/form-data' thủ công.
//    Set cứng chuỗi này THIẾU boundary → BE không parse được multipart.
//    Dùng Content-Type: undefined để axios tự sinh 'multipart/form-data; boundary=...'
//    (đồng bộ với frontend web). Khẳng định "set thủ công là ĐÚNG cho RN" trong bản cũ là SAI.
export const fileStorageService = {
  uploadFile: (payload: { uri: string; name: string; type: string; purpose?: number }) => {
    const form = new FormData();
    form.append('file', { uri: payload.uri, name: payload.name, type: payload.type } as unknown as Blob);
    if (payload.purpose !== undefined) form.append('purpose', String(payload.purpose));
    return axiosInstance.post<CommonResponse<FileUploadResponse>>(
      ENDPOINTS.FILES.UPLOAD, form,
      { headers: { 'Content-Type': undefined } }
    );
  },
};

interface FileUploadResponse {
  fileId: string;
  objectKey: string;
  fileName: string;
  contentType: string;
  size: number;
  publicUrl: string | null;
}
```

### Bước 6 — Shared hook
| File | Action | Ghi chú |
|------|--------|---------|
| `src/hooks/useCountdown.ts` | create | Countdown timer dùng chung cho tất cả OTP (phone, email change). Nhận `seconds`, trả `{ remaining, isActive, start, reset }` |

### Bước 7 — Hooks profile
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/profile/hooks/useProfile.ts` | create | `useQuery` GET /api/auth/me |
| `src/features/profile/hooks/useUpdateProfile.ts` | create | `useMutation` PUT /api/auth/me/profile → invalidate `QUERY_KEY.profile.me` |
| `src/features/profile/hooks/useUploadAvatar.ts` | create | `useMutation`: pick image → `useUploadFile()` (module `features/file-storage/`, GH-25) → POST /api/auth/me/avatar → invalidate profile |

### Bước 8 — Hooks account
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/account/hooks/useChangePassword.ts` | create | onSuccess → clearTokens + clearSession + navigate('/login') |
| `src/features/account/hooks/useChangeEmail.ts` | create | Step 1 mutation |
| `src/features/account/hooks/useConfirmEmailChange.ts` | create | Step 2 mutation → onSuccess: clearTokens + clearSession + navigate('/login') |
| `src/features/account/hooks/useSendPhoneOtp.ts` | create | Mutation gửi OTP SMS |
| `src/features/account/hooks/useVerifyPhoneOtp.ts` | create | Mutation xác thực OTP SMS → invalidate profile |
| `src/features/account/hooks/useInit2FA.ts` | create | Mutation → trả Init2faResponse {secret, otpAuthUri, pendingToken} |
| `src/features/account/hooks/useConfirm2FA.ts` | create | Mutation {pendingToken, code} → {enabled, backupCodes[8]} → invalidate profile |
| `src/features/account/hooks/useDisable2FA.ts` | create | Mutation {password, totpCode} → invalidate profile |
| `src/features/account/hooks/useRegenerateBackupCodes.ts` | create | Mutation {totpCode} → {backupCodes[8]} |
| `src/features/account/hooks/useDeactivateAccount.ts` | create | onSuccess → clearTokens + clearSession + navigate('/login') |
| `src/features/account/hooks/useDeleteAccount.ts` | create | onSuccess → clearTokens + clearSession + navigate('/login') |

### Bước 9 — Hooks sessions
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/account/hooks/useSessions.ts` | create | `useQuery` GET + `useMutation` revokeSession + `useMutation` revokeAll — export `{ sessions, revokeSession, revokeAll }`. Giữ gộp vì 3 operation dùng chung `QUERY_KEY.sessions.list` để invalidate. Nếu cần test isolate → tách sau, không bắt buộc trước approve. |

> **Implementation note — revokeAll (Bước 9):** `currentRefreshToken` lấy từ `secureStore.getRefreshToken()` là async. Phải `await` bên trong `mutationFn` trước khi build payload:
> ```ts
> mutationFn: async () => {
>   const refreshToken = await secureStore.getRefreshToken(); // await bắt buộc
>   return sessionService.revokeAll({ exceptCurrent: true, currentRefreshToken: refreshToken });
> }
> ```
> Nếu quên `await` → `refreshToken` là `Promise`, payload bị sai, BE trả lỗi.

> **Implementation note — RevokeAllPayload (Bước 5):** Khi viết `account.types.ts`, verify `currentRefreshToken` có bắt buộc không bằng cách đọc lại `docs/api-auth.md §POST /api/sessions/revoke-all`. Nếu BE không require → bỏ field này khỏi type để giảm complexity. Không assume trước khi đọc doc.

### Bước 9b — Schemas Zod
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/profile/schemas/profile.schema.ts` | create | Validation cho ProfileForm (fullName, address, birthDate...) |
| `src/features/account/schemas/changePassword.schema.ts` | create | currentPassword, newPassword, confirmPassword |
| `src/features/account/schemas/changeEmail.schema.ts` | create | newEmail, currentPassword |
| `src/features/account/schemas/phoneVerify.schema.ts` | create | phoneNumber, otp |

### Bước 10 — Components
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/profile/components/AvatarPicker.tsx` | create | Hiển thị avatar từ `displayAvatarUrl` (prepend BASE_URL) + nút chọn ảnh via `expo-image-picker` |
| `src/features/profile/components/ProfileForm.tsx` | create | fullName, phoneNumber, address, birthDate — controlled state |
| `src/features/account/components/ChangePasswordForm.tsx` | create | currentPassword, newPassword, confirmPassword |
| `src/features/account/components/ChangeEmailForm.tsx` | create | Step 1: newEmail + currentPassword |
| `src/features/account/components/ConfirmEmailOtpForm.tsx` | create | Step 2: OTP input + countdown via `useCountdown` |
| `src/features/account/components/PhoneVerifyForm.tsx` | create | Nút gửi OTP + OTP input + countdown 60s via `useCountdown` |
| `src/features/account/components/TwoFASetup.tsx` | create | Wizard GH-295: init (QRCode value={otpAuthUri} + secret) → confirm (nhập TOTP) → modal 8 backup codes "Đã lưu". Kèm form disable {password, totpCode} + regenerate {totpCode} |
| `src/features/account/components/SessionCard.tsx` | create | IP, userAgent, issuedAt, isCurrent badge, nút revoke (disabled nếu isCurrent) |

### Bước 11 — Screens
| File | Action | Ghi chú |
|------|--------|---------|
| `app/(customer)/(tabs)/profile.tsx` | create | Avatar + tên + role + nút "Chỉnh sửa" + nút "Cài đặt" |
| `app/(customer)/edit-profile.tsx` | create | ProfileForm + AvatarPicker |
| `app/(customer)/settings/index.tsx` | create | Menu list: Bảo mật tài khoản, Phiên đăng nhập, Vùng nguy hiểm |
| `app/(customer)/settings/change-password.tsx` | create | ChangePasswordForm |
| `app/(customer)/settings/change-email.tsx` | create | ChangeEmailForm → ConfirmEmailOtpForm (2 bước trong 1 screen). `useState<1\|2>(1)` quản lý step — chuyển step 2 trong `onSuccess` của mutation (không trong handleSubmit) để tránh race condition. |
| `app/(customer)/settings/phone-verify.tsx` | create | PhoneVerifyForm |
| `app/(customer)/settings/two-fa.tsx` | create | TwoFASetup wizard (init→confirm) hoặc form disable {password, totpCode} + regenerate nếu đang bật |
| `app/(customer)/settings/sessions.tsx` | create | FlatList SessionCard + nút "Đăng xuất tất cả thiết bị khác" |
| `app/(customer)/settings/danger-zone.tsx` | create | Deactivate + Delete với Alert confirm 2 lần |

### Bước 12 — Navigation (modify)
| File | Action | Ghi chú |
|------|--------|---------|
| `app/(customer)/(tabs)/_layout.tsx` | create | Tabs navigator với `dashboard` + `profile` — `(customer)/_layout.tsx` là Stack, Tabs được quản lý ở sub-group `(tabs)/` |

## Enums

> **Note (thêm sau khi SHIPPED):** Plan gốc ghi enums inline trong types file — codebase thực tế tách ra file enum riêng với `as const` pattern.

| Enum | File |
|------|------|
| `AccountStatusEnum`, `AvatarSourceEnum` | `src/features/profile/enums/profile.enum.ts` |
| `RefreshTokenStatus` | `src/features/account/enums/account.enum.ts` |

`types/*.ts` chỉ re-export từ `enums/` — không define inline.

## Endpoints

| Method | Path | Request Body / Params | Response |
|--------|------|-----------------------|----------|
| GET | `/api/auth/me` | — | `CommonResponse<AccountDto>` |
| PUT | `/api/auth/me/profile` | `UpdateProfilePayload { fullName, phoneNumber?, address?, birthDate?, timeZone? }` | `CommonResponse<AccountDto>` | ← field tên `birthDate` trong request (response `AccountDto` dùng `dateOfBirth`) |
| POST | `/api/auth/me/avatar` | `{ avatarFileId: string }` | `CommonResponse<AccountDto>` |
| PATCH | `/api/accounts/me/password` | `{ currentPassword, newPassword, confirmPassword }` | `CommonResponse<null>` | ← `confirmPassword` bắt buộc gửi lên BE |
| POST | `/api/accounts/me/change-email` | `ChangeEmailPayload` | `CommonResponse<Guid>` | BE đã wire route (api-auth.md). Lỗi: 401 password sai · 409 email đã dùng · 422 email trùng hiện tại |
| POST | `/api/accounts/me/confirm-email-change` | `{ otp: string }` | `CommonResponse<Guid>` | BE đã wire route. Success → revoke session. Lỗi: 401 OTP sai/hết hạn · 409 no pending · 423 lockout |
| POST | `/api/accounts/me/send-phone-otp` | *(không có body)* | `CommonResponse<null>` |
| POST | `/api/accounts/me/verify-phone-otp` | `{ otp: string }` | `CommonResponse<null>` |
| ~~POST~~ | ~~`/api/accounts/me/2fa/enable`~~ | — | ⚠️ **DEPRECATED (GH-295) — luôn 410 Gone.** Dùng init+confirm. |
| POST | `/api/accounts/me/2fa/init` | *(không có body)* | `CommonResponse<Init2faResponse>` — `{ secret, otpAuthUri, pendingToken }` |
| POST | `/api/accounts/me/2fa/confirm` | `{ pendingToken, code }` | `CommonResponse<Confirm2faResponse>` — `{ enabled, backupCodes[8] }` |
| POST | `/api/accounts/me/2fa/disable` | `{ password, totpCode }` | `CommonResponse<Guid>` |
| POST | `/api/accounts/me/2fa/backup-codes/regenerate` | `{ totpCode }` | `CommonResponse<RegenBackupResponse>` — `{ backupCodes[8] }` |
| POST | `/api/accounts/me/deactivate` | *(không có body)* | `CommonResponse<null>` |
| DELETE | `/api/accounts/me` | *(không có body)* | `CommonResponse<null>` |
| GET | `/api/sessions/me` | `?activeOnly=bool` (query) | `CommonResponse<SessionDto[]>` |
| DELETE | `/api/sessions/{id}` | — | `CommonResponse<number>` |
| POST | `/api/sessions/revoke-all` | `{ exceptCurrent?: bool, currentRefreshToken?: string }` | `CommonResponse<number>` |
| POST | `/api/files/upload` | `FormData { file, purpose: '1' }` (multipart) | `CommonResponse<FileUploadResponse>` | ✅ Đi qua cùng API gateway base URL (`EXPO_PUBLIC_API_URL`) như mọi route `/api/*` — dùng chung `axiosInstance`, không cần base URL riêng |

## Query Keys

```ts
// Thêm vào src/lib/queryKeys.ts:
KEY.profile  = ['profile']  as const
KEY.sessions = ['sessions'] as const

QUERY_KEY.profile = {
  me: () => [...KEY.profile, 'me'] as const,
}
QUERY_KEY.sessions = {
  list: (activeOnly?: boolean) => [...KEY.sessions, 'list', activeOnly] as const,
}
```

## Approach

**Avatar display:**
```
AccountDto.displayAvatarUrl → `/api/files/{fileId}/download` (path tương đối)
→ render: Image source={{ uri: BASE_URL + displayAvatarUrl, headers: { Authorization: `Bearer ${token}` } }}
   ⚠️ Endpoint download CẦN auth → RN <Image> KHÔNG tự gắn Bearer, phải truyền `headers` trong source,
      nếu không avatar trả 401. (Cùng pattern useAuthImageHeaders dùng cho ticket attachment.)
→ null → hiển thị placeholder initials avatar
BASE_URL = EXPO_PUBLIC_API_URL từ env
```

**Avatar upload flow (3 bước):**
```
user tap AvatarPicker
→ expo-image-picker.launchImageLibraryAsync({ mediaTypes: Images })
→ { uri, fileName, mimeType }
→ useUploadFile().mutate({ uri, name, type, purpose: 1 })  // POST /api/files/upload multipart (GH-25 module)
→ { fileId }
→ profileService.setAvatar({ avatarFileId: fileId })  // POST /api/auth/me/avatar
→ invalidate QUERY_KEY.profile.me → UI refresh
```

**Đổi email flow (2 bước trong 1 screen):**
```
Step 1: ChangeEmailForm → useChangeEmail.mutate({ newEmail, currentPassword })
        → success → setStep(2) (local state)
Step 2: ConfirmEmailOtpForm → useConfirmEmailChange.mutate({ otp })
        → success → clearTokens() + clearSession() + navigate('/(auth)/login')
```

**2FA enable flow (GH-295 — wizard 2 bước):**
```
Bước 1: useInit2FA.mutate()
  → { secret, otpAuthUri, pendingToken }
  → render <QRCode value={otpAuthUri} size={200} /> + secret text (nhập tay)
  → giữ pendingToken trong state
Bước 2: user nhập 6 số TOTP → useConfirm2FA.mutate({ pendingToken, code })
  → { enabled: true, backupCodes[8] }
  → hiển thị 8 backup codes, BẮT BUỘC user "Đã lưu" trước khi đóng (hiện 1 lần)
Disable: form { password, totpCode } → useDisable2FA.mutate(...)  (422 message generic)
Regenerate: { totpCode } → useRegenerateBackupCodes.mutate(...) → 8 codes mới
```

**Session management:**
```
GET /api/sessions/me?activeOnly=true → FlatList<SessionCard>
SessionCard.isCurrent=true → badge "(Thiết bị này)", nút revoke disabled
DELETE /api/sessions/{id} → invalidate QUERY_KEY.sessions.list
POST /api/sessions/revoke-all { exceptCurrent: true, currentRefreshToken }
  → currentRefreshToken lấy từ secureStore.getRefreshToken()
  → success → invalidate sessions list
```

**Deactivate / Delete (onSuccess trong mutation, không trong component):**
```
onSuccess: async () => {
  await clearTokens();
  clearSession();
  router.replace('/(auth)/login');
}
```

## Edge Cases
- `displayAvatarUrl = null` → render initials placeholder, không crash
- **Avatar download cần auth:** `displayAvatarUrl` trỏ `/api/files/{id}/download` (endpoint cần Bearer). `<Image>` phải truyền `headers: { Authorization }` trong `source`, nếu không trả 401 → avatar không hiển thị
- Đổi email / Xóa tài khoản → clearToken trong `onSuccess` của mutation (không trong component)
- OTP confirm email: không cần gửi lại email mới — server đọc từ `PendingEmail`
- 2FA: enable BẮT BUỘC verify TOTP qua confirm (không activate ngay); backup codes hiện 1 lần — modal "Đã lưu". `twoFactorEnabled=true` → login sẽ yêu cầu verify-2fa (GH-3 đã có) → KHÔNG còn disclaimer "enforce Sprint sau"
- Deactivate / Delete → Alert confirm 2 lần trước khi gọi mutation
- Session `isCurrent = true` → disable nút revoke
- Phone OTP cooldown 60s → dùng `useCountdown(60)` trong PhoneVerifyForm
- Confirm email OTP cooldown → `useCountdown` từ `otpExpiresInSeconds` (nếu BE trả) hoặc 300s default
- `expo-image-picker` cần permission camera roll → gọi `requestMediaLibraryPermissionsAsync()` trước khi launch
- **`birthDate` vs `dateOfBirth`:** PUT profile gửi `birthDate`, nhưng `AccountDto` response trả `dateOfBirth` — khi pre-fill form từ profile, map `account.profile?.birthDate` → form field `birthDate`
- **Đổi email:** BE đã wire route `/change-email` + `/confirm-email-change` (api-auth.md) → enable screen `change-email.tsx`. Sau `confirm-email-change` thành công → mọi session bị revoke → clearTokens + redirect login.
- **`GET /api/sessions/me` response `data` nullable:** guard `data ?? []` trước khi render FlatList
- **File Storage base URL (RESOLVED 2026-06-14):** `/api/files/*` đi qua cùng API gateway (`EXPO_PUBLIC_API_URL`) như mọi route `/api/*` — KHÔNG có service riêng port 4005, dùng chung `axiosInstance`. Giả định "port 4005" trong bản plan gốc không được áp dụng.

## Success Criteria
| Tiêu chí | Cách verify |
|----------|------------|
| Tab "Hồ sơ" hiển thị cho Customer | Manual: đăng nhập Customer → thấy tab |
| Xem + sửa profile (tên, phone, địa chỉ) | Manual: sửa → reload → đúng |
| Avatar upload + hiển thị ngay | Manual: chọn ảnh → confirm → avatar cập nhật |
| Đổi mật khẩu → tự động logout | Manual: đổi pw → về màn hình login |
| Đổi email 2 bước hoàn tất | Manual: step1 → OTP → step2 → logout |
| Xác thực SĐT thành công | Manual: gửi OTP → nhập → phoneConfirmed=true |
| 2FA: QR + secret + disclaimer hiển thị | Manual: bật 2FA → thấy QR, text, disclaimer |
| Sessions: revoke phiên khác | Manual: revoke → phiên biến mất |
| Danger zone: deactivate → logout | Manual: confirm → navigate login |
| `tsc --noEmit` 0 lỗi | `npx tsc --noEmit` |
| `eslint --max-warnings=0` | `npx eslint . --max-warnings=0` |

## Steps
- [x] Bước 1: `npx expo install expo-image-picker react-native-svg react-native-qrcode-svg` — 2026-05-31
- [x] Bước 2: Thêm PROFILE, ACCOUNT, SESSIONS, FILES vào `src/lib/endpoints.ts` — 2026-05-31
- [x] Bước 3: Thêm `KEY.profile`, `KEY.sessions`, `QUERY_KEY.profile.me`, `QUERY_KEY.sessions.list` vào `src/lib/queryKeys.ts` — 2026-05-31
- [x] Bước 4: Tạo `src/features/profile/types/profile.types.ts` (AccountDto, AccountProfileDto, StaffProfileDto, AvatarSourceEnum, AccountStatusEnum) — 2026-05-31
- [x] Bước 5: Tạo `src/features/account/types/account.types.ts` (ChangePasswordPayload, 2FA types GH-295: Init2faResponse/Confirm2fa*/Disable2faPayload/RegenBackup*, SessionDto, RevokeAllPayload — currentRefreshToken optional) — 2026-05-31 · ⚠️ rework C1
- [x] Bước 6: Tạo `src/lib/fileStorage.ts` (uploadFile multipart) — 2026-05-31 — *superseded bởi GH-25 (2026-06-15): chuyển sang `features/file-storage/services/file-storage.service.ts`, file lib đã xóa*
- [x] Bước 7: Tạo `src/features/profile/services/profile.service.ts` — 2026-05-31
- [x] Bước 8: Tạo `src/features/account/services/account.service.ts` + `session.service.ts` — 2026-05-31
- [x] Bước 9: Tạo `src/hooks/useCountdown.ts` (dùng chung cho mọi OTP countdown) — 2026-05-31
- [x] Bước 10: Tạo hooks profile: `useProfile`, `useUpdateProfile`, `useUploadAvatar` — 2026-05-31
- [x] Bước 11: Tạo hooks account: `useChangePassword`, `useChangeEmail`, `useConfirmEmailChange`, `useSendPhoneOtp`, `useVerifyPhoneOtp`, `useInit2FA`, `useConfirm2FA`, `useDisable2FA`, `useRegenerateBackupCodes`, `useDeactivateAccount`, `useDeleteAccount` — 2026-05-31 · ⚠️ rework C1 (init/confirm/regenerate thay enable)
- [x] Bước 12: Tạo hook sessions: `useSessions` — 2026-05-31
- [x] Bước 13: Tạo components: `AvatarPicker`, `ProfileForm`, `ChangePasswordForm`, `ChangeEmailForm`, `ConfirmEmailOtpForm`, `PhoneVerifyForm`, `TwoFASetup`, `SessionCard` — 2026-05-31
- [x] Bước 14: Tạo screens: `profile.tsx`, `edit-profile.tsx` — 2026-05-31
- [x] Bước 15: Tạo settings screens: `settings/index.tsx`, `change-password`, `change-email`, `phone-verify`, `two-fa`, `sessions`, `danger-zone` — 2026-05-31
- [x] Bước 16: Tạo `app/(customer)/(tabs)/_layout.tsx` — Tabs navigator (dashboard + profile); `(customer)/_layout.tsx` là Stack, không phải Tabs — 2026-05-31
- [x] Bước 17: `npx tsc --noEmit` 0 lỗi + `npx expo lint` 0 warning → PASS — 2026-05-31

## Câu hỏi đã giải đáp
| Câu hỏi | Trả lời |
|---------|---------|
| Navigation approach? | Tab [A] — thêm tab "Hồ sơ" vào `(customer)/_layout.tsx` |
| Cài `expo-image-picker`? | Được — đã cập nhật `mobile.md` |
| 2FA QR: library hay text? | Cả hai — `react-native-qrcode-svg` + secret text — đã cập nhật `mobile.md` |
| Staff navigation scope? | Ngoài scope GH-4 — Staff chỉ có `/(staff)/index.tsx` từ GH-3 |
| `usePhoneVerify` gộp hay tách? | Tách thành `useSendPhoneOtp` + `useVerifyPhoneOtp` |
| file-storage trong features/ hay lib/? | Ban đầu `src/lib/fileStorage.ts`. **GH-25 (2026-06-15) đổi sang module `src/features/file-storage/`** (bám theo frontend web) — lib cũ đã xóa. |
| Package install: npm hay expo? | Tất cả dùng `npx expo install` — đảm bảo version compat Expo SDK 51 |
| Avatar URL construct từ fileId hay displayAvatarUrl? | Dùng `displayAvatarUrl` (prepend BASE_URL), không tự construct từ fileId |
