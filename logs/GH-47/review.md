## BÁO CÁO CODE REVIEW — feat/GH-47-permission-feature-gate — 2026-06-22

### TÓM TẮT
Permission feature-gate cho Mobile: `authz.ts` (P + checkPermission/checkRole), `useMyPermissions` sync `/me/permissions` đè sessionStore, `PermissionGuard` guard 9 màn, gate nút Resolve (staff) + Tạo ticket (customer). 6 file mới + 14 file sửa. `tsc --noEmit` PASS, surgical, đúng plan. **PASS.**

### PHÂN TÍCH

**Architecture**
- ✅ Không business logic trong component — gating qua `checkPermission` (pure, lib `authz.ts`).
- ✅ API qua service → hook: `permission.service.ts` → `useMyPermissions` (TanStack Query), không fetch trong component.
- ✅ File đúng chỗ: `authz.ts` → `src/lib/`; permission infra → `src/features/auth/`.
- ✅ Không cross-feature import: `PermissionGuard` (features/auth) chỉ được import bởi app screens; `TicketActionBar` (features/staff) nhận prop `canResolve`, không import features/auth.
- ✅ Zustand chỉ auth session: `setPermissions` cập nhật `user.permissions` (vẫn thuộc session), bất biến, no-op khi `user === null`.
- ✅ Dùng `axiosInstance` sẵn có, không tạo instance mới.

**Code Quality**
- ✅ PascalCase: `PermissionGuard`, `PermissionsSync`.
- ✅ Không hardcode URL — `ENDPOINTS.AUTH.ME_PERMISSIONS`.
- ✅ Không còn `console.log`.
- ✅ `queryKey` dùng factory `QUERY_KEY.permissions.me()`, không inline array.
- ✅ `P` là `as const` + type `Permission` — type-safe, không TS enum.
- ✅ Guard rules-of-hooks an toàn: wrapper export → inner component (`*Inner`), hook của inner chỉ chạy khi có quyền.

**Error Handling / Edge**
- ✅ Token `perm[]` = snapshot/fallback khi `/me/permissions` lỗi (401/403) hoặc offline → không khóa nhầm.
- ✅ `200 + permissions: []` (role inactive) → `setPermissions([])` → gate ẩn / guard chặn (đúng nghĩa).
- ✅ `PermissionGuard` denied → fallback rõ ràng + nút Quay lại.

🟡 Warning: `src/features/auth/hooks/useMyPermissions.ts` — lỗi query không surface UI (cố ý dùng token fallback). Chấp nhận theo design; nếu muốn chặt hơn có thể thêm `retry: false` cho 401/403 để khỏi retry vô ích.
🟡 Warning: `app/(staff)/tickets/[id].tsx` — 2 selector `useSessionStore` (`accountId` + `user`). Gộp 1 selector lấy `user` được, nhưng giữ nguyên cũng ổn (minor).
🟡 Warning: `app/(staff)/(tabs)/customers.tsx` — guard 1 bottom tab; khi thiếu `user.view` nút "Quay lại" (`router.back()`) trên tab gốc có thể là no-op. UX edge nhỏ, đã ghi trong plan (ngoài scope tối ưu).

### RỦI RO & LƯU Ý
- Gate Escalate **đã chủ ý bỏ** (staff không có `ticket.escalate` theo seed) — nút giữ nguyên, đúng quyết định.
- `battery.update` + `notification.view`: define `P.*` nhưng chưa wire (ghi rõ plan) — không phải dead code lỗi.
- Behavior change: nút "Tạo ticket" (customer) + "Resolve" (staff) giờ phụ thuộc permission tươi — cần test với tài khoản có/không quyền (chuyển sang `/kltn-test`).

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**. `tsc` sạch, không có Critical. 3 Warning đều minor/by-design, không chặn ship.
