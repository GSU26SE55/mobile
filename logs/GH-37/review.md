# BÁO CÁO CODE REVIEW — feat/GH-37-auth-self-service — 2026-06-20

## TÓM TẮT
Code GH-37 (4 feature self-service auth + infra device-id) đạt chất lượng tốt: layering chuẩn (screen→hook→service→axios), đúng convention mobile, types khớp BE C# source đã verify, `tsc --noEmit` PASS. **Có 1 vấn đề process nghiêm trọng (branch base = GH-36) phải xử lý TRƯỚC khi ship** — không phải lỗi code.

## PHÂN TÍCH

### 🔴 Critical (process — phải xử lý trước/khi ship)
- **Branch base sai:** `feat/GH-37` được tạo từ `feat/GH-36-sync-notification-contract`, nên chứa commit `d3b8bd0 feat(GH-36)`. `git diff dev...HEAD` lòi ra toàn bộ file GH-36 (`docs/api-*.md`, `src/lib/push.ts`, `notifications/*`, `logs/GH-36/*`). → Nếu mở PR GH-37 vào `dev` ngay bây giờ, diff sẽ lẫn GH-36.
  **Cách xử lý (chọn 1):**
  1. **Khuyến nghị:** merge PR GH-36 vào `dev` trước → rebase `feat/GH-37` lên `dev` mới (`git rebase dev`) → commit d3b8bd0 biến mất khỏi diff.
  2. Nếu GH-36 chưa xong: đổi base PR GH-37 sang `feat/GH-36` (PR chồng), hoặc cherry-pick code GH-37 sang branch mới tách từ `dev`.

### 🟡 Warning
- **File ngoài scope trong working tree:** `.claude/rules/tech/mobile.md` (do user/linter sửa cho GH-36) — KHÔNG thuộc GH-37. Khi `/kltn-ship` **stage thủ công**, loại file này. (`package.json`/`package-lock.json` là của GH-37 — 3 expo package — giữ lại.)
- **ESLint pre-existing:** `src/features/account/types/account.types.ts:3` — `import/first` (dòng import sau export, có sẵn từ trước GH-37). Không sửa (ngoài scope, surgical).
- **Typed-routes `.expo/types`:** đã regenerate local (gitignored). Đồng đội/CI phải chạy `npx expo start` 1 lần để regen, nếu không `tsc` sẽ báo route mới (`trusted-devices`, `reactivate`) chưa có. Bình thường với Expo Router.

### ✅ Pass
- **axios.ts:** bug-fix GH-295 (`LOGIN_VERIFY_2FA` vào PUBLIC_ENDPOINTS) + SMS/reactivate public; `X-Device-Id` attach TRƯỚC nhánh public (verify-2fa có fingerprint); UA per-install best-effort. `endsWith` không collide giữa `/login`, `/login/2fa/sms`, `/login/verify-2fa`.
- **auth.service.ts:** `verify2faLogin` + `send2faSms` gửi header `X-Challenge-Token` (khớp `PolicyTwoFactorVerify` BE); reactivate request/verify đúng shape.
- **login-2fa.tsx:** 3 mode loại trừ (totp/backup/sms) — không bao giờ gửi `isBackupCode`&`isSmsCode` cùng true; trust device ẩn khi backup (server bỏ qua); payload build đúng.
- **useExportMyData.ts:** đọc `res.data.data` (axios không unwrap), **guard `if(!data) throw`** trước khi ghi file (bài học GH-88), check `Sharing.isAvailableAsync()`, tên file khớp BE (`account-export-{idNoHyphen}-{yyyymmdd}.json`), API expo-file-system SDK 54 (`File`/`Paths`) dùng đúng.
- **useTrustedDevices.ts:** query + revokeOne/revokeAll, invalidate `KEY.trustedDevices` (pattern giống `useSessions`).
- **trusted-devices.tsx / reactivate.tsx:** confirm Alert cho revoke; reactivate 2 bước `safeParse`, verify thành công → `router.replace('/(auth)/login')` (không cấp token — đúng BE).
- **Types:** `TrustedDeviceDto`, `AccountDataExportDto` + `StaffProfileSnapshot` khớp BE; enum export = `string` (tránh bẫy enum số).
- **tsc --noEmit:** PASS (0 errors).

## RỦI RO & LƯU Ý
- **Bắt buộc trước ship:** xử lý branch base (Critical ở trên) — nếu không PR sẽ lẫn GH-36.
- **Smoke test runtime** (regression 2FA login, trust device end-to-end + restart, SMS 409 phone chưa verify, reactivate anti-enumeration) chưa chạy được headless → để `/kltn-test 37` trên Expo.
- **UA override Android (OkHttp):** best-effort như đã thiết kế — AC đo bằng hành vi trust-persist, không đo chuỗi UA.

## KẾT LUẬN
**PASS** (chất lượng code) — Độ tự tin: **Cao**.
→ Điều kiện bắt buộc trước ship: xử lý **branch base GH-36** (rebase lên `dev` sau khi GH-36 merge) + stage thủ công loại `.claude/rules/tech/mobile.md`.
→ Tiếp theo: `/kltn-test 37` (smoke test trên Expo).
