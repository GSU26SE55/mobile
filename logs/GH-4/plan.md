# Plan — GH-4: [Mobile] Profile & Account Management — Customer/Staff

## Metadata
- **Status:** REVIEWING | **Role:** Mobile | **Ngày:** 2026-05-31 | **Reviewed:** 2026-05-31
- **Issue:** #4 — https://github.com/GSU26SE55/mobile/issues/4
- **Sprint:** Sprint 2 (due: 2026-06-13)

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
  ENABLE_2FA:              '/api/accounts/me/2fa/enable',
  DISABLE_2FA:             '/api/accounts/me/2fa/disable',
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

### Bước 4 — Types
| File | Action | Shape key |
|------|--------|-----------|
| `src/features/profile/types/profile.types.ts` | create | AccountDto, AccountProfileDto, StaffProfileDto, UpdateProfilePayload, AvatarSourceEnum, AccountStatusEnum |
| `src/features/account/types/account.types.ts` | create | ChangePasswordPayload, ChangeEmailPayload, ConfirmEmailChangePayload, PhoneOtpPayload, TwoFAEnableResponse, SessionDto, RefreshTokenStatus, RevokeAllPayload |

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

**StaffProfileDto** — shape từ `docs/api-auth.md §StaffProfileDto`:
```ts
interface StaffProfileDto {
  accountId: string;
  employeeCode: string | null;
  department: string | null;
  maxConcurrentTickets: number;
  isAvailable: boolean;
  notes: string | null;
  skills: StaffSkillDto[];
}
interface StaffSkillDto {
  skillCode: string;
  skillLevel: number;
  certifiedUntil: string | null;
}
```

**TwoFAEnableResponse** — shape từ `docs/api-auth.md §POST /api/accounts/me/2fa/enable`:
```ts
interface TwoFAEnableResponse {
  secret: string;      // Base32 key — nhập thủ công vào Authenticator app
  otpAuthUri: string;  // otpauth://totp/... — dùng làm value cho QRCode
}
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
| `src/features/account/services/account.service.ts` | create | changePassword, changeEmail, confirmEmailChange, sendPhoneOtp, verifyPhoneOtp, enable2FA, disable2FA, deactivate, deleteAccount |
| `src/features/account/services/session.service.ts` | create | getSessions, revokeSession, revokeAll |
| `src/lib/fileStorage.ts` | create | uploadFile — đặt trong lib/ để tránh cross-feature import (profile/hooks → lib/) |

**`src/lib/fileStorage.ts`** — multipart upload:
```ts
// Không đặt trong features/file-storage/ — tránh cross-feature import
export const fileStorageLib = {
  upload: (uri: string, name: string, type: string) => {
    const form = new FormData();
    form.append('file', { uri, name, type } as any);
    form.append('purpose', '1'); // FilePurposeEnum.Avatar
    return axiosInstance.post<CommonResponse<FileUploadResponse>>(
      ENDPOINTS.FILES.UPLOAD, form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
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
| `src/features/profile/hooks/useUploadAvatar.ts` | create | `useMutation`: pick image → `fileStorageLib.upload()` → POST /api/auth/me/avatar → invalidate profile |

### Bước 8 — Hooks account
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/account/hooks/useChangePassword.ts` | create | onSuccess → clearTokens + clearSession + navigate('/login') |
| `src/features/account/hooks/useChangeEmail.ts` | create | Step 1 mutation |
| `src/features/account/hooks/useConfirmEmailChange.ts` | create | Step 2 mutation → onSuccess: clearTokens + clearSession + navigate('/login') |
| `src/features/account/hooks/useSendPhoneOtp.ts` | create | Mutation gửi OTP SMS |
| `src/features/account/hooks/useVerifyPhoneOtp.ts` | create | Mutation xác thực OTP SMS → invalidate profile |
| `src/features/account/hooks/useEnable2FA.ts` | create | Mutation → trả TwoFAEnableResponse |
| `src/features/account/hooks/useDisable2FA.ts` | create | Mutation → invalidate profile |
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
| `src/features/account/components/TwoFASetup.tsx` | create | QRCode (react-native-qrcode-svg, value={otpAuthUri}) + secret text + disclaimer "2FA sẽ enforce tại login ở Sprint sau" |
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
| `app/(customer)/settings/two-fa.tsx` | create | TwoFASetup (enable) hoặc nút disable nếu đang bật |
| `app/(customer)/settings/sessions.tsx` | create | FlatList SessionCard + nút "Đăng xuất tất cả thiết bị khác" |
| `app/(customer)/settings/danger-zone.tsx` | create | Deactivate + Delete với Alert confirm 2 lần |

### Bước 12 — Navigation (modify)
| File | Action | Ghi chú |
|------|--------|---------|
| `app/(customer)/(tabs)/_layout.tsx` | create | Tabs navigator với `dashboard` + `profile` — `(customer)/_layout.tsx` là Stack, Tabs được quản lý ở sub-group `(tabs)/` |

## Approach

**Avatar display:**
```
AccountDto.displayAvatarUrl → `/api/files/{fileId}/download` (path tương đối)
→ render: Image source={{ uri: BASE_URL + displayAvatarUrl }}
→ null → hiển thị placeholder initials avatar
BASE_URL = EXPO_PUBLIC_API_URL từ env
```

**Avatar upload flow (3 bước):**
```
user tap AvatarPicker
→ expo-image-picker.launchImageLibraryAsync({ mediaTypes: Images })
→ { uri, fileName, mimeType }
→ fileStorageLib.upload(uri, fileName, mimeType)      // POST /api/files/upload multipart
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

**2FA enable flow:**
```
useEnable2FA.mutate()
→ { secret, otpAuthUri }
→ render <QRCode value={otpAuthUri} size={200} />
→ render secret text để user nhập thủ công
→ disclaimer: "2FA sẽ được enforce tại bước đăng nhập ở Sprint sau"
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
- Đổi email / Xóa tài khoản → clearToken trong `onSuccess` của mutation (không trong component)
- OTP confirm email: không cần gửi lại email mới — server đọc từ `PendingEmail`
- 2FA: `twoFactorEnabled` chưa enforce tại login (Sprint sau) → hiện disclaimer trong TwoFASetup
- Deactivate / Delete → Alert confirm 2 lần trước khi gọi mutation
- Session `isCurrent = true` → disable nút revoke
- Phone OTP cooldown 60s → dùng `useCountdown(60)` trong PhoneVerifyForm
- Confirm email OTP cooldown → `useCountdown` từ `otpExpiresInSeconds` (nếu BE trả) hoặc 300s default
- `expo-image-picker` cần permission camera roll → gọi `requestMediaLibraryPermissionsAsync()` trước khi launch

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
- [x] Bước 5: Tạo `src/features/account/types/account.types.ts` (ChangePasswordPayload, TwoFAEnableResponse, SessionDto, RevokeAllPayload — currentRefreshToken optional) — 2026-05-31
- [x] Bước 6: Tạo `src/lib/fileStorage.ts` (uploadFile multipart — đặt trong lib/ tránh cross-feature) — 2026-05-31
- [x] Bước 7: Tạo `src/features/profile/services/profile.service.ts` — 2026-05-31
- [x] Bước 8: Tạo `src/features/account/services/account.service.ts` + `session.service.ts` — 2026-05-31
- [x] Bước 9: Tạo `src/hooks/useCountdown.ts` (dùng chung cho mọi OTP countdown) — 2026-05-31
- [x] Bước 10: Tạo hooks profile: `useProfile`, `useUpdateProfile`, `useUploadAvatar` — 2026-05-31
- [x] Bước 11: Tạo hooks account: `useChangePassword`, `useChangeEmail`, `useConfirmEmailChange`, `useSendPhoneOtp`, `useVerifyPhoneOtp`, `useEnable2FA`, `useDisable2FA`, `useDeactivateAccount`, `useDeleteAccount` — 2026-05-31
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
| file-storage trong features/ hay lib/? | Đặt trong `src/lib/fileStorage.ts` — tránh cross-feature import |
| Package install: npm hay expo? | Tất cả dùng `npx expo install` — đảm bảo version compat Expo SDK 51 |
| Avatar URL construct từ fileId hay displayAvatarUrl? | Dùng `displayAvatarUrl` (prepend BASE_URL), không tự construct từ fileId |
