## BÁO CÁO CODE REVIEW — feature/GH-4-profile-account-mgmt — 2026-05-31
### Scope: Mobile (React Native / Expo)
### Effort: Deep

---

### TÓM TẮT
Implement đầy đủ Profile & Account Management gồm 47 files mới/modified, bao gồm types, services, hooks, schemas (Zod), components, screens. Tất cả issues tìm thấy đã được fix trong cùng session — code đạt chuẩn ship.

---

### PHÂN TÍCH

#### Issues đã fix trong review

🔴 Fixed — `ConfirmEmailOtpForm.tsx:24`
- **Vấn đề:** `useCountdown` khởi tạo với `remaining = 0`, không gọi `start()` → countdown không bao giờ chạy → UI luôn hiển thị "OTP đã hết hạn"
- **Fix:** Thêm `useEffect(() => { start(expiresInSeconds); }, [expiresInSeconds, start])` để bắt đầu đếm ngược khi form mount

🟡 Fixed — `profile.tsx:27`
- **Vấn đề:** `uploadAvatar.mutate()` không có `onError` → lỗi upload avatar bị swallow silently
- **Fix:** Thêm `onError: (error) => handleErrorApi({ error })`

🟡 Fixed — `sessions.tsx:49-51`
- **Vấn đề:** `void count` — code smell, unused variable
- **Fix:** Xóa biến count, giữ `onSuccess: () => {}`

🟡 Fixed — `two-fa.tsx` toàn file
- **Vấn đề:** `onError: (e) => Alert.alert(...)` dùng trực tiếp thay vì `handleErrorApi` — inconsistent với established pattern
- **Fix:** Thay tất cả bằng `onError: (error) => handleErrorApi({ error })`, thêm import

🟡 Fixed — `errors.ts`
- **Vấn đề:** `wrapAxiosError` exported nhưng không được gọi ở đâu — dead code
- **Fix:** Xóa function

---

#### Checklist PASS

✅ **Architecture**
- Không có API call trực tiếp trong components — tất cả đi qua `services/` → hooks
- `fileStorage.ts` đặt trong `src/lib/` (không phải `features/`) — tránh cross-feature import
- Không có cross-feature import giữa `profile` ↔ `account`
- Axios instance duy nhất từ `src/lib/axios.ts`
- Zustand chỉ cho auth session

✅ **Error Handling Pattern** (nhất quán với FE)
- Form screens: `mutateAsync + try-catch + handleErrorApi({ error, setFieldError })`
- Non-form actions: `onError: (error) => handleErrorApi({ error })`
- Axios interceptor wrap BE errors → `HttpError` / `EntityError`
- `EntityError` → map lỗi xuống field; `HttpError` → Alert

✅ **Zod Validation**
- 4 schema files: `profile.schema.ts`, `changePassword.schema.ts`, `changeEmail.schema.ts`, `phoneVerify.schema.ts`
- Validation chạy client-side trước khi gọi API
- `fieldErrors` prop nhận BE errors từ parent — hiện đỏ dưới từng input

✅ **Auth Guard**
- Tất cả màn hình mới nằm trong `(customer)/` group → protected bởi `_layout.tsx` (`Redirect href="/(auth)/login"` khi chưa auth)
- `edit-profile`, `settings/*` ẩn khỏi tab bar qua `href: null`

✅ **Code Quality**
- Không có `console.log`
- Không hardcode URL/token trong components
- Tất cả components PascalCase
- Loading state xử lý đầy đủ
- Error state hiển thị rõ ràng

✅ **Query Keys**
- Dùng `QUERY_KEY.profile.me()` và `QUERY_KEY.sessions.list()` factory — không inline array
- `invalidateQueries` dùng đúng factory

✅ **TypeScript + Lint**
- `npx tsc --noEmit` → 0 errors
- `npx expo lint` → 0 warnings

---

### RỦI RO & LƯU Ý

- **`.expo/types/router.d.ts`** được update thủ công với 9 routes mới. File này sẽ bị overwrite khi `npx expo start` chạy lần đầu — routes sẽ được regenerate đúng từ filesystem. Không phải risk runtime, chỉ là dev experience note.
- **2FA chưa enforce tại login** (BE note: Sprint sau) — `TwoFASetup` đã có disclaimer rõ ràng.
- **Avatar upload flow** phụ thuộc FileStorageService — cần BE đã deploy service này để test end-to-end.
- **`useCountdown` stability** — `start` là `useCallback`, `expiresInSeconds` là prop — `useEffect` deps array đúng, không có infinite re-render.

---

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**

Tất cả 5 issues (1 critical + 4 warnings) đã được fix trước khi kết thúc review session. Code sạch, pattern nhất quán với FE, TypeScript + lint 0 lỗi.
