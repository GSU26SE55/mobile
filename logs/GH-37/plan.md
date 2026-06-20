# Plan — GH-37: [Mobile] Auth self-service endpoints (Trusted Devices, SMS 2FA, Reactivate, GDPR export)

## Metadata
- **Status:** REVIEWING | **Role:** Mobile (FE rules) | **Ngày:** 2026-06-20
- **Issue:** #37 — https://github.com/GSU26SE55/mobile/issues/37
- **Sprint:** Sprint 3 (current, due 2026-06-27)
- **Dev:** Trần Minh Trí (SE183109)

> **Tham chiếu:** FE web đã implement cùng bộ tính năng tại `frontend/logs/GH-88`. Mobile là **tập con** của GH-88: bỏ Cross-device 2FA (#AUTH-51) + Admin merge (#AUTH-47) vì mobile không có camera-from-web flow & không có role Admin.

> **BE contract verified (2026-06-20, đọc trực tiếp C# source `services/AuthService`):**
> - `Verify2FALoginCommand.cs` — có đủ `IsSmsCode` + `TrustDevice` + `TrustDeviceLabel` (mutex IsBackupCode/IsSmsCode, validate ở BE). ✅
> - `TrustedDeviceDto.cs` — 9 field khớp section Types dưới. ✅
> - `RateLimitingExtensions.cs:75` + `AuthController.cs:96,441` — `login/verify-2fa` **và** `login/2fa/sms` cùng dùng `PolicyTwoFactorVerify`, partition theo header `X-Challenge-Token` (fallback IP). → gửi header trên cả 2 là đúng & cần. ✅
> - `ExportMyDataQuery.cs` — `AccountDataExportDto` + `StaffProfileSnapshot = {employeeCode?, department?, skillTier?, notes?}` (khác doc cũ, khớp BE thật). Trả `CommonResponse<AccountDataExportDto>` → mobile đọc `res.data.data`. ✅ **Enum trong export serialize thành STRING** (`status:"Active"`, `auditLogs[].action:"LoginSuccess"`, `skillTier:"Tier2"`) → type field = `string`, KHÔNG dùng `AccountStatusEnum`.
> - `TrustedDeviceFingerprintHelper.cs` — **fingerprint = `SHA-256(DeviceId + "|" + UserAgent)`**; deviceId HOẶC userAgent null/blank ⇒ trả `null` ⇒ **skip silently** (không trust được). `Verify2FALoginCommandHandler.cs:266` (trust) + `GetMyTrustedDevicesQueryHandler.cs:45` (isCurrentDevice) dùng cùng hash. ⇒ Mobile **bắt buộc** gửi cả `X-Device-Id` **và** `User-Agent` ổn định. 🔴

## Mục tiêu
Implement 7 endpoint self-service auth (scope Customer/Staff) cho Mobile App — `docs/api-auth.md` đã document đủ nhưng code chưa có. Đây là việc viết service/hook/screen + infra device-id, gom thành 4 feature, ship trong 1 PR (umbrella).

## Scope
**Trong scope (7 endpoint / 4 feature):**
1. **Trusted Devices** (#AUTH-48) — `GET /me/trusted-devices`, `DELETE /me/trusted-devices/{id}`, `DELETE /me/trusted-devices`. Màn hình "Thiết bị tin cậy" trong Settings + checkbox "Tin cậy thiết bị này" (+ label) ở màn verify-2fa (nguồn data của trusted list).
2. **SMS 2FA fallback** (#AUTH-58) — `POST /auth/login/2fa/sms`. Nút "Gửi OTP qua SMS" ở màn verify-2fa, submit lại verify-2fa với `isSmsCode=true`.
3. **Reactivate account** (#AUTH-50) — `POST /auth/reactivate-request` + `POST /auth/reactivate-verify`. Màn `/reactivate` 2 bước + link ở màn login.
4. **GDPR export** (#AUTH-62) — `GET /me/export`. Nút "Tải dữ liệu của tôi" trong Danger Zone → ghi file JSON + mở share sheet.
5. **Infra** — `X-Device-Id` (UUID lưu SecureStore) attach global trong axios để bật fingerprint trust device + highlight `isCurrentDevice`.

**Ngoài scope:**
- Cross-device 2FA setup (#AUTH-51), Admin merge (#AUTH-47), `revoke`/`introspect`/`PUT /accounts/{id}` — sai scope mobile.
- Không refactor flow 2FA single-device (`/2fa/init` + `/2fa/confirm`) hiện có.
- Không đụng backend (chỉ consume).

## Packages mới (đã được Leader duyệt)
```bash
npx expo install expo-crypto expo-file-system expo-sharing
```
- `expo-crypto` → `randomUUID()` sinh device id.
- `expo-file-system` + `expo-sharing` → ghi file JSON export + mở share sheet.

## Endpoints
| # | Method | Path | Auth | Request | Response `data` |
|---|--------|------|------|---------|-----------------|
| 1 | GET | `/api/accounts/me/trusted-devices` | ✅ + `X-Device-Id` | — | `TrustedDeviceDto[]` |
| 2 | DELETE | `/api/accounts/me/trusted-devices/{id}` | ✅ | — | `string (Guid)` (idempotent 200) |
| 3 | DELETE | `/api/accounts/me/trusted-devices` | ✅ | — | `null` (count trong `message`) |
| 4 | POST | `/api/auth/login/2fa/sms` | ❌ + header `X-Challenge-Token` | `{ challengeToken }` | `string` (phone masked `******1234`) |
| 5 | POST | `/api/auth/reactivate-request` | ❌ | `{ email }` | `string` (email normalized) |
| 6 | POST | `/api/auth/reactivate-verify` | ❌ | `{ email, otp }` | `string (Guid)` accountId |
| 7 | GET | `/api/accounts/me/export` | ✅ | — | `AccountDataExportDto` |

> #4: sau khi nhận SMS → user submit `POST /auth/login/verify-2fa` với `{ challengeToken, code, isBackupCode:false, isSmsCode:true }` (**bắt buộc** `isSmsCode=true`). Header `X-Challenge-Token` cần gửi kèm cả `/2fa/sms` và `/verify-2fa` để rate-limit partition đúng.

## Enums
| Enum | File nguồn |
|------|-----------|
| (không thêm enum mới) | — |

## Types
| File | Action | Types |
|------|--------|-------|
| `src/features/account/types/account.types.ts` | modify | `TrustedDeviceDto` (id, label, ipPrefix, userAgentSnapshot?, trustedAt, expiresAt, lastUsedAt?, usageCount, isCurrentDevice); `AccountDataExportDto` + snapshot types — `staffProfile?: { employeeCode?, department?, skillTier?, notes? }` (theo `StaffProfileSnapshot` BE thật, KHÔNG theo doc cũ), kèm account/profile?/sessions[]/auditLogs[]/backupCodes[]/exportedAt/format/version |
| `src/features/auth/types/auth.types.ts` | modify | Mở rộng `Verify2faLoginPayload` thêm `isSmsCode?: boolean`, `trustDevice?: boolean`, `trustDeviceLabel?: string`; thêm `Sms2faPayload` (challengeToken); `ReactivateRequestPayload` (email); `ReactivateVerifyPayload` (email, otp) |

## Schema (Zod)
| File | Action | Field |
|------|--------|-------|
| `src/features/auth/schemas/reactivate.schema.ts` | create | request: `email: z.string().email()` · verify: `email`, `otp: z.string().length(6)` (parse thủ công bằng `safeParse` — không dùng RHF, theo mobile rules) |

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| **Infra** | | |
| `src/lib/deviceId.ts` | create | `getDeviceId()` — đọc SecureStore key `device_id`; nếu chưa có → `Crypto.randomUUID()` → lưu lại. Cache in-memory để tránh đọc SecureStore mỗi request |
| `src/lib/axios.ts` | modify | **(1) 🔴 BUG-FIX (GH-295 regression):** thêm `LOGIN_VERIFY_2FA` vào `PUBLIC_ENDPOINTS` — hiện đang THIẾU (axios.ts:70-80) → khi user submit OTP, interceptor không match public → `tryRefresh()` (chưa có refresh token) → **logout + redirect /login ngay** ⇒ flow 2FA login hiện gãy. **(2)** thêm `LOGIN_2FA_SMS`, `REACTIVATE_REQUEST`, `REACTIVATE_VERIFY` vào `PUBLIC_ENDPOINTS` (endpoint public, tránh tryRefresh→logout sai). **(3) 🔴 Device fingerprint:** attach `X-Device-Id` **TRƯỚC** nhánh early-return PUBLIC (verify-2fa/login cần cho fingerprint); `getDeviceId()` async → `await` 1 lần rồi cache in-memory. **User-Agent = best-effort:** thử set UA ổn định per-install (`SolarBatteryMobile (<Platform.OS>)`, KHÔNG kèm app version) nhưng **KHÔNG phụ thuộc override thành công** — RN Android (OkHttp) thường nuốt UA do JS đặt, iOS tôn trọng hơn. Mục tiêu thật = fingerprint deterministic; UA mặc định của native cũng ổn định per-install ⇒ `SHA256(deviceId\|UA) ≠ null` & ổn định ⇒ trust device vẫn chạy dù override bị bỏ. **KHÔNG** thêm header lạ (vd `X-Client-UA`) vì BE hash đúng header `User-Agent` chuẩn. *(RN-web: browser cấm override UA → dùng UA browser sẵn, vẫn ổn định.)* |
| `src/lib/endpoints.ts` | modify | `AUTH.LOGIN_2FA_SMS`, `AUTH.REACTIVATE_REQUEST`, `AUTH.REACTIVATE_VERIFY`; `ACCOUNT.TRUSTED_DEVICES`, `ACCOUNT.TRUSTED_DEVICE(id)`, `ACCOUNT.EXPORT` |
| `src/lib/queryKeys.ts` | modify | `KEY.trustedDevices` + `QUERY_KEY.trustedDevices.list()` |
| **1. Trusted Devices** | | |
| `src/features/account/services/trustedDevice.service.ts` | create | `list()` / `revokeOne(id)` / `revokeAll()` |
| `src/features/account/hooks/useTrustedDevices.ts` | create | `useQuery` (staleTime ~1 phút) + `revokeOne` + `revokeAll` mutations → invalidate `KEY.trustedDevices` (pattern giống `useSessions.ts`) |
| `src/features/account/components/TrustedDeviceCard.tsx` | create | Card: label, ipPrefix, trustedAt/expiresAt, lastUsedAt, usageCount, badge "Thiết bị này" khi `isCurrentDevice`, nút revoke (confirm Alert) |
| `app/(customer)/settings/trusted-devices.tsx` | create | List + EmptyState + nút "Thu hồi tất cả" (confirm Alert) |
| `app/(customer)/settings/index.tsx` | modify | Thêm item "Thiết bị tin cậy" → route trusted-devices |
| **2. SMS 2FA + trust device** | | |
| `src/features/auth/services/auth.service.ts` | modify | `send2faSms(challengeToken)` (header `X-Challenge-Token`); `verify2faLogin` thêm header `X-Challenge-Token` |
| `src/features/auth/hooks/useSend2faSms.ts` | create | `useMutation` → trả phone masked |
| `app/(auth)/login-2fa.tsx` | modify | **3 mode loại trừ nhau (1 state `mode: 'totp'\|'backup'\|'sms'`)** — KHÔNG dùng 2 boolean rời để tránh gửi `isBackupCode` & `isSmsCode` cùng `true` (BE trả 400). Map khi submit: totp→`{}`, backup→`{isBackupCode:true}`, sms→`{isSmsCode:true}`. Nút "Không có Authenticator? Gửi OTP qua SMS" (gọi `useSend2faSms` → hiển thị phone masked; nếu có resend countdown thì dùng **1 setInterval ổn định**, không tái tạo mỗi giây — bài học GH-88). Checkbox "Tin cậy thiết bị này 30 ngày" + input label, **ẩn/disable khi mode='backup'** (server bỏ qua trust với backup code) |
| **3. Reactivate** | | |
| `src/features/auth/services/auth.service.ts` | modify | `reactivateRequest(email)`, `reactivateVerify(payload)` |
| `src/features/auth/hooks/useReactivateRequest.ts` | create | `useMutation` |
| `src/features/auth/hooks/useReactivateVerify.ts` | create | `useMutation` |
| `app/(auth)/reactivate.tsx` | create | 2 bước (email → OTP), `safeParse` validate; success → Alert + `router.replace('/(auth)/login')` |
| `app/(auth)/login.tsx` | modify | Thêm link "Khôi phục tài khoản đã xóa" cạnh "Quên mật khẩu?" |
| **4. GDPR export** | | |
| `src/features/account/services/account.service.ts` | modify | `exportMyData()` → `axiosInstance.get<CommonResponse<AccountDataExportDto>>(ACCOUNT.EXPORT)` |
| `src/features/account/hooks/useExportMyData.ts` | create | `useMutation`: đọc `res.data.data` → **guard `if (!data) throw` TRƯỚC khi ghi file** (bài học GH-88: tránh báo "Đã tải" khi data undefined) → `JSON.stringify(_, null, 2)` → ghi `FileSystem.documentDirectory + account-export-{id}-{yyyymmdd}.json` → check `Sharing.isAvailableAsync()` → `Sharing.shareAsync(uri)` |
| `app/(customer)/settings/danger-zone.tsx` | modify | Thêm section "Dữ liệu cá nhân (GDPR)" + nút "Tải dữ liệu của tôi" (non-destructive, đặt trên cùng) |

## Approach
- **Layering chuẩn:** screen → hook (TanStack Query) → service → axios. Không gọi API trong component.
- **X-Device-Id:** `getDeviceId()` cache UUID in-memory (đọc/ghi SecureStore `device_id` lần đầu, sinh bằng `Crypto.randomUUID()`). Interceptor `await getDeviceId()` rồi attach **trước** nhánh PUBLIC để cả login/verify-2fa có fingerprint → trust device mới lưu được + `isCurrentDevice` highlight đúng. Cold start: 1 lần đọc SecureStore; sau đó 0 I/O.
- **🔴 verify-2fa bug-fix:** đây là sửa regression của GH-295 (flow 2FA login đang gãy do thiếu `LOGIN_VERIFY_2FA` trong PUBLIC) — KHÔNG phải infra cho feature mới. Có AC regression riêng + smoke test bắt buộc.
- **🔴 Device fingerprint (X-Device-Id + User-Agent):** trust device chỉ lưu khi BE compute được `SHA-256(deviceId|UA)` ≠ null. Mobile set UA cố định per-install → fingerprint deterministic, sống sót qua app/OS update; `isCurrentDevice` match đúng vì list request dùng cùng UA + deviceId.
- **2FA mode mutex:** màn verify dùng 1 enum mode (totp/backup/sms) → không bao giờ gửi `isBackupCode`&`isSmsCode` cùng true (BE 400).
- **Export enum = string:** type các field enum trong `AccountDataExportDto` là `string` literal từ BE — render trực tiếp, không map qua enum số.
- **X-Challenge-Token (đã verify BE):** chỉ dùng để rate-limit partition (BE lookup challenge qua body field, không qua header) — thiếu header thì vẫn chạy nhưng share counter theo IP (dễ false-block sau NAT). Gửi header trên cả `send2faSms` và `verify2faLogin` để partition đúng.
- **SMS 2FA:** `useSend2faSms` set header `X-Challenge-Token` per-request → trả phone masked. User nhập OTP SMS → `verify2faLogin` với `isSmsCode:true`. `useVerify2faLogin` hiện đã forward nguyên payload nên chỉ cần mở rộng type + truyền field từ screen.
- **Trust device:** checkbox + label ở `login-2fa.tsx` → `trustDevice`/`trustDeviceLabel` vào verify-2fa (TOTP/SMS path; ẩn khi đang dùng backup code vì server bỏ qua).
- **Reactivate:** màn public 2 bước trong `(auth)`; verify thành công KHÔNG cấp token → `router.replace` về login để user đăng nhập lại.
- **GDPR export:** axios interceptor không unwrap → hook đọc `res.data.data`; ghi file JSON vào documentDirectory rồi `Sharing.shareAsync` (kiểm tra `Sharing.isAvailableAsync()` trước).

## Edge Cases
- **Trusted Devices:** list rỗng → EmptyState; revoke idempotent (200 dù đã revoke) → vẫn toast/Alert success + refetch; `isCurrentDevice` chỉ đúng khi đã gửi `X-Device-Id`.
- **SMS 2FA:** `409` account chưa verify phone → Alert "Hãy dùng Authenticator hoặc backup code"; `422` challenge expired → quay về `/login`; `429` rate limit → disable nút + thông báo thử lại sau.
- **Reactivate:** request luôn `200` (anti-enumeration) → message trung lập; verify `401` OTP sai/hết hạn → lỗi dưới input; `404` ngoài window 90 ngày → Alert.
- **GDPR export:** `Sharing.isAvailableAsync()` false → Alert fallback; lỗi mạng → handleErrorApi.
- **Axios:** verify-2fa/sms/reactivate là PUBLIC → không attach Bearer, không tryRefresh; nhưng vẫn phải có `X-Device-Id` (verify-2fa) và `X-Challenge-Token` (sms/verify-2fa).

## Acceptance Criteria
- [ ] **🔴 Regression:** login với account bật 2FA → submit TOTP ở màn verify-2fa → đăng nhập thành công, **KHÔNG** bị đá về /login (ver-2fa nằm trong PUBLIC_ENDPOINTS).
- [ ] `X-Device-Id` attach trên request verify-2fa & GET trusted-devices; persist qua restart app (cùng UUID).
- [ ] **Trust device end-to-end (đo hành vi, KHÔNG đo chuỗi UA):** tick "Tin cậy thiết bị" lúc verify → device **thực sự xuất hiện** trong list với `isCurrentDevice=true` (fingerprint không bị skip silently).
- [ ] **Fingerprint ổn định qua restart:** trust 1 lần → **restart app** → GET trusted-devices vẫn `isCurrentDevice=true` (chứng minh deterministic dù UA override có bị Android nuốt hay không). *(UA override chỉ best-effort — không nằm trong Ac đo bằng log JS.)*
- [ ] login-2fa: không có đường nào gửi `isBackupCode` & `isSmsCode` cùng `true` (3 mode loại trừ).
- [ ] GDPR export: khi `res.data.data` undefined → KHÔNG hiện "Đã tải", báo lỗi đúng.
- [ ] Trusted Devices: list đúng (label, ipPrefix, trustedAt, expiresAt, lastUsedAt, usageCount), badge "Thiết bị này", revoke 1 + revoke all hoạt động và refetch.
- [ ] login-2fa: nút gửi SMS hoạt động, hiển thị phone masked, verify với `isSmsCode:true` đăng nhập thành công.
- [ ] login-2fa: checkbox "Tin cậy thiết bị này" + label → device xuất hiện trong Trusted Devices sau khi login.
- [ ] Reactivate: màn 2 bước, request anti-enumeration message, verify thành công → về `/login`.
- [ ] GDPR export: bấm nút → mở share sheet với file `account-export-{id}-{yyyymmdd}.json`.
- [ ] `npx tsc --noEmit` PASS (không lỗi type).

## Steps
- [x] Bước 1 — Types + Schema: mở rộng `account.types.ts` (TrustedDeviceDto, AccountDataExportDto), `auth.types.ts` (verify-2fa fields, Sms2fa, Reactivate*); `reactivate.schema.ts`. — 2026-06-20
- [x] Bước 2 — Infra: cài 3 package; `deviceId.ts`; axios attach `X-Device-Id` + UA + mở rộng `PUBLIC_ENDPOINTS` (gồm bug-fix LOGIN_VERIFY_2FA); `endpoints.ts`; `queryKeys.ts`. — 2026-06-20
- [x] Bước 3 — Services: `trustedDevice.service.ts`; `auth.service.ts` (send2faSms + X-Challenge-Token, reactivate*); `account.service.ts` (exportMyData). — 2026-06-20
- [x] Bước 4 — Hooks: `useTrustedDevices`, `useSend2faSms`, `useReactivateRequest`, `useReactivateVerify`, `useExportMyData`. — 2026-06-20
- [x] Bước 5 — Screens/Components: `TrustedDeviceCard` + `trusted-devices.tsx` + settings item + _layout; `login-2fa.tsx` (3-mode SMS + trust checkbox); `reactivate.tsx` + login link + _layout; `danger-zone.tsx` (export button). — 2026-06-20
- [x] Bước 6 — Quality gate: `npx tsc --noEmit` → **PASS (0 errors)**; eslint changed files 0 errors (1 warning pre-existing `account.types.ts:3` import/first, không thuộc code mới). Smoke test trên Expo (regression 2FA + trust e2e) → chạy ở `/kltn-test 37`. — 2026-06-20

> **🔶 Ship hygiene (bài học GH-88):** working tree đang lẫn file ngoài scope (`docs/api-notification.md`, `docs/api-sms.md`, `docs/api-*.md` modified — 1 file đang mở trong IDE). Khi `/kltn-ship`: **stage thủ công từng file của GH-37**, TUYỆT ĐỐI không `git add -A`/`git add .`. Branch `feat/GH-37-auth-self-service` chỉ chứa file thuộc 4 feature + infra.

## Câu hỏi đã giải đáp
1. **Tham chiếu** → đọc `frontend/logs/GH-88`; mobile = tập con (bỏ cross-device + admin merge). BE verified deployed.
2. **X-Device-Id** → **Thêm `expo-crypto`** dùng `randomUUID()`, lưu SecureStore, attach global trong axios (nhất quán intent với web).
3. **GDPR export** → **Thêm `expo-file-system` + `expo-sharing`**: ghi file JSON + mở share sheet (đúng "file download" nhất trên mobile).
4. **Delivery** → 1 PR umbrella cho cả 4 feature (như GH-88 web).
5. **Review GH-37 (P1)** → phát hiện verify-2fa đang gãy (thiếu `LOGIN_VERIFY_2FA` trong PUBLIC). Reframe thành bug-fix GH-295 + AC regression riêng.
6. **Review GH-37 (P2)** → verify BE: `PolicyTwoFactorVerify` đọc `X-Challenge-Token` cho cả verify-2fa & 2fa/sms (`RateLimitingExtensions.cs:75`). Header chỉ dùng rate-limit partition, không phải lookup.
7. **Review GH-37 (P3)** → `getDeviceId()` async → `await` 1 lần + cache in-memory; thêm AC X-Device-Id có mặt trên verify-2fa.
8. **BE contract** → đọc trực tiếp C# source xác nhận `TrustedDeviceDto`, `AccountDataExportDto`/`StaffProfileSnapshot`, `Verify2FALoginCommand` (xem block đầu plan). Không còn claim "chưa verify".
9. **Review vòng 3 — P1 mới (User-Agent):** `TrustedDeviceFingerprintHelper.cs` xác nhận fingerprint = `SHA256(deviceId|UA)`, blank UA → skip silently. → set UA cố định per-install trong axios (ngoài X-Device-Id). AC trust device end-to-end.
10. **Review vòng 3 — P2 mới (mutex flags):** màn verify-2fa dùng 1 enum mode (totp/backup/sms), không gửi 2 flag cùng true.
11. **Review vòng 3 — P3 mới (export enum=string):** type field enum trong export là `string`, không dùng enum số.
12. **Bài học GH-88:** guard `if(!data)` trước khi ghi file export; setInterval ổn định cho SMS countdown; ship stage thủ công, không `git add -A`.
13. **Review vòng 4 — UA override best-effort:** RN Android (OkHttp) có thể nuốt UA do JS đặt; iOS tôn trọng. Không phụ thuộc override — UA mặc định native cũng ổn định per-install nên fingerprint vẫn deterministic. AC đổi sang **đo hành vi** (trust persist qua restart → isCurrentDevice=true), KHÔNG đo chuỗi UA trong log. Không thêm header lạ (BE hash header `User-Agent` chuẩn).
