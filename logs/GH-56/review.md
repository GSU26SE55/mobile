## BÁO CÁO CODE REVIEW — feat/GH-56-staff-technical-tools — 2026-06-28
### Scope: FE (Mobile / React Native + Expo Router)
### Effort: Deep (20 files mới, ~1277 dòng, 2 feature module)

### TÓM TẮT
Feature Staff Technical Tools (battery types read-only + IoT calibration) implement đúng kiến trúc mobile: service → hook TanStack Query → component, enums `as const`, Zod safeParse thủ công. 1 lỗi runtime Critical phát hiện trong review đã được fix tại chỗ. Sau fix: `tsc --noEmit` PASS.

### PHÂN TÍCH

🔴 Critical (đã FIX trong review):
- `app/(staff)/tools/calibration/create.tsx` (onSubmit) — parse `expiresAt` bằng `new Date(...).toISOString()` nằm NGOÀI try-catch. Nhập ngày sai định dạng (vd `2027-13-45`) → `toISOString()` ném `RangeError` → crash màn. **Fix:** guard `Number.isNaN(d.getTime())` → set field error `expiresAt` thay vì throw. Đã verify tsc PASS.

🟡 Warning (chấp nhận trong scope Sprint 1):
- `create.tsx` — `expiresAt`, `batteryAssetId` nhập tay (chưa có date-picker / asset-picker trong stack). Đủ cho scope; nâng cấp sau. Có validation: date guard + Zod `batteryAssetId` `.uuid()`.
- `endpoints.ts` BY_CODE — `deviceCode` không `encodeURIComponent`. An toàn vì `deviceCodeSchema` ép `[A-Z0-9-]` (uppercase) trước khi gọi, không có ký tự cần encode.
- `create.tsx` scale/offset — `Number('abc')` → NaN; `z.number()` (zod v4) reject NaN nên hiện field error, không lọt xuống BE. OK.

✅ Pass:
- Architecture: không business logic trong component; API qua `services/` → hook; file đặt đúng `features/battery-types`, `features/iot-devices`; KHÔNG cross-feature import (debounce inline thay vì mượn `features/kb`); dùng `lib/axios` chung.
- queryKey: dùng `QUERY_KEY.batteryTypes.*` / `QUERY_KEY.iotDevices.*` factory; `invalidateQueries` dùng `KEY.iotDevices` root — không hardcode string.
- Error handling: form create dùng `try-catch` + `handleErrorApi({ error, setFieldError })` map listErrors xuống field; non-form (delete) dùng `onError: (error) => handleErrorApi({ error })`. Không tự toast trong hook.
- Auth: toàn bộ màn dưới `app/(staff)/tools/*`; `(staff)/_layout.tsx` redirect nếu `role !== 'STAFF'` → tự gate. 5 route đã đăng ký trong `_layout.tsx`. Entry qua row Profile.
- Loading/Error/Empty state: cả 4 màn list/detail/calibration đều có 3 nhánh.
- Naming: component PascalCase, hook `use*`, service `*.service.ts`, screen lowercase — đúng convention.
- Review-fix tracking (L1–L3, G1–G3, N1, N2) đã hiện thực hoá trong code (prefill scale=1/offset=0; siteId; trim/upper deviceCode; DELETE check isSuccess; filter channel+includeExpired; status enum; `.refine` expiresAt>calibratedAt).
- Không `console.log` sót.
- Expo Router typed routes: đã regenerate `.expo/types` → push() typecheck PASS.

### RỦI RO & LƯU Ý
- Branch chồng lên GH-57 (lựa chọn B) — `_layout.tsx` cùng đụng GH-57; khi merge sẽ cần resolve conflict (bình thường).
- Calibration phụ thuộc Staff đọc đúng `deviceCode` trên thiết bị; sai → 404 hiển thị "không tìm thấy" (đã xử lý).
- `calibratedAt` cố định = thời điểm submit (không cho chỉnh) — đúng ý đồ (kỹ thuật viên hiệu chỉnh tại chỗ); N2 không chặn tương lai theo contract.

### KẾT LUẬN
PASS — Độ tự tin: Cao
(1 Critical phát hiện & fix trong review; tsc PASS; checklist architecture/error/auth đạt.)
