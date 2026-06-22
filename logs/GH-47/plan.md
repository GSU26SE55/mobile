# Plan — GH-47: [Mobile] Permission infrastructure + feature-gate (authz + useMyPermissions)

## Metadata
- **Status:** REVIEWING | **Role:** FE (Mobile) | **Ngày:** 2026-06-22
- **Issue:** #47 — https://github.com/GSU26SE55/mobile/issues/47
- **Sprint:** Sprint 3 (due 2026-06-27)
- **Dev:** Trần Minh Trí

## Mục tiêu
Dựng hạ tầng permission feature-gate cho Mobile (mirror Web `authz.ts`): `P.*` constants + `checkPermission`/`checkRole`. Nguồn `permissions`: token `perm[]` khởi tạo (fallback) → `GET /api/auth/me/permissions` fetch đè bản tươi từ DB → lưu `sessionStore`. Áp gate action (ẩn/hiện) + gate read (guard màn) theo quyền. Đổi quyền → invalidate query là thấy, không cần login lại.

## Scope
**Trong scope:**
- `src/lib/authz.ts` mới: `P` (8 code), `checkPermission(user, code)`, `checkRole(user, ...roles)`.
- `ENDPOINTS.AUTH.ME_PERMISSIONS` + `permission.service` + `useMyPermissions` (TanStack Query) + `sessionStore.setPermissions`.
- `PermissionsSync` component mount ở root `_layout` → sync `permissions` tươi vào store khi authed.
- `PermissionGuard` component tái sử dụng → guard read-screen / create-screen, render fallback "Không có quyền" + nút quay lại nếu thiếu quyền.
- **Gate action (ẩn/hiện nút):**
  - CUSTOMER `(tabs)/tickets.tsx` — nút "Tạo ticket" (header + empty state) theo `ticket.create`.
  - STAFF `TicketActionBar` — nút Resolve theo `ticket.resolve`.
- **Guard create (chống deep-link):**
  - CUSTOMER `tickets/create.tsx` — `PermissionGuard` theo `ticket.create`.
- **Gate read (guard màn feature):**
  - `user.view` → STAFF `(tabs)/customers.tsx` + `customers/[customerId].tsx`.
  - `knowledge_base.view` → `(staff)/kb/index.tsx` + `(customer)/kb/index.tsx`.
  - `battery.view` → `(staff)/batteries/[id].tsx` + `(customer)/batteries/[id].tsx`.
  - `ticket.view` → `(staff)/tickets/[id].tsx` + `(customer)/tickets/[id].tsx`.

**Ngoài scope (đã chốt):**
- **Gate Escalate: BỎ** — giữ behavior cũ, nút Escalate luôn hiện cho staff (`ticket.escalate` chỉ Manager/Admin theo seed; gate sẽ ẩn nhầm). `P.*` không có `TICKET_ESCALATE`.
- `battery.update`: define `P.BATTERY_UPDATE` nhưng **không wire** — màn STAFF battery read-only, không có action update.
- `notification.view`: define `P.NOTIFICATION_VIEW` nhưng **không wire** — màn notifications/alerts là tab điều hướng chính (customer dùng tab "alerts" gộp), guard cả tab gây UX xấu. Để dùng sau nếu cần.
- Không gate các bottom tab điều hướng chính (dashboard, tickets list, alerts, profile) — chỉ guard màn detail/feature thứ cấp + tab `customers` (staff). Mất tab giữa phiên gây UX xấu.
- BE: endpoint sẵn có — không sửa BE, không sửa docs.

## Endpoints
| Method | Path | Mục đích / Request / Response |
|--------|------|-------------------------------|
| GET | `/api/auth/me/permissions` | Permission tươi của role user hiện tại. No body. AccountId từ JWT. → `CommonResponse<MyPermissionsDto>`, `MyPermissionsDto = { roleId, roleName, permissions: PermissionDto[] }`. 401 token/account, 403 chưa gán role, 200+`[]` role inactive. |

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/authz.ts` | create | `P` (8 code) + `checkPermission` + `checkRole` |
| `src/features/auth/types/permission.types.ts` | create | `PermissionDto`, `MyPermissionsDto` |
| `src/features/auth/services/permission.service.ts` | create | `getMyPermissions()` → trả `PermissionDto[]` |
| `src/features/auth/hooks/useMyPermissions.ts` | create | `useQuery` + `useEffect` sync `setPermissions` |
| `src/features/auth/components/PermissionsSync.tsx` | create | Gọi `useMyPermissions`, render `null` |
| `src/features/auth/components/PermissionGuard.tsx` | create | `{permission}` → render children nếu có quyền, else fallback "Không có quyền" + back |
| `src/lib/endpoints.ts` | modify | thêm `AUTH.ME_PERMISSIONS` |
| `src/lib/queryKeys.ts` | modify | thêm `KEY.permissions` + `QUERY_KEY.permissions.me()` |
| `src/stores/sessionStore.ts` | modify | thêm `setPermissions(permissions: string[])` |
| `app/_layout.tsx` | modify | mount `<PermissionsSync />` trong AuthProvider |
| `src/features/staff/components/TicketActionBar.tsx` | modify | thêm prop `canResolve?` (default true) — **không** đụng Escalate |
| `app/(staff)/tickets/[id].tsx` | modify | `canResolve` qua `checkPermission` → `TicketActionBar`; wrap `PermissionGuard` ticket.view |
| `app/(customer)/(tabs)/tickets.tsx` | modify | gate 2 nút "Tạo ticket" theo `P.TICKET_CREATE` |
| `app/(customer)/tickets/create.tsx` | modify | wrap `PermissionGuard` ticket.create |
| `app/(staff)/(tabs)/customers.tsx` | modify | wrap `PermissionGuard` user.view |
| `app/(staff)/customers/[customerId].tsx` | modify | wrap `PermissionGuard` user.view |
| `app/(staff)/kb/index.tsx` | modify | wrap `PermissionGuard` knowledge_base.view |
| `app/(customer)/kb/index.tsx` | modify | wrap `PermissionGuard` knowledge_base.view |
| `app/(staff)/batteries/[id].tsx` | modify | wrap `PermissionGuard` battery.view |
| `app/(customer)/batteries/[id].tsx` | modify | wrap `PermissionGuard` battery.view |
| `app/(customer)/tickets/[id].tsx` | modify | wrap `PermissionGuard` ticket.view |

## Approach
- `authz.ts`: `P` là `as const` object (8 code, value = code lowercase BE): `BATTERY_VIEW`, `BATTERY_UPDATE`, `TICKET_VIEW`, `TICKET_CREATE`, `TICKET_RESOLVE`, `NOTIFICATION_VIEW`, `KNOWLEDGE_BASE_VIEW`, `USER_VIEW`. `checkPermission(user, code) = !!user && user.permissions.includes(code)`. `checkRole(user, ...roles) = !!user && roles.includes(user.role)`.
- Khởi tạo: `decodeToken` (login + hydration) đã set `permissions` từ token `perm[]` — giữ nguyên làm snapshot/fallback.
- Refresh tươi: `useMyPermissions` (enabled khi có `user`) fetch `/me/permissions` → `useEffect` map `data.map(p => p.code)` → `setPermissions(codes)` đè store. (v5 không có `onSuccess` trên `useQuery`.)
- `setPermissions` bất biến: `set(s => s.user ? { user: { ...s.user, permissions } } : s)`.
- `PermissionsSync` mount 1 lần ở `_layout` (trong `QueryClientProvider` + `AuthProvider`) → tự chạy cho mọi authed user. Đổi quyền: `invalidateQueries(QUERY_KEY.permissions.me())` → refetch → đè.
- `PermissionGuard`: đọc `user` từ store, `checkPermission(user, permission)`; có quyền → `children`; không → fallback view (icon + "Bạn không có quyền truy cập" + nút "Quay lại" `router.back()`). Dùng cho read-screen + create-screen.
- Gate action: parent tính cờ qua `checkPermission` rồi truyền prop xuống component lá; component render có điều kiện. Không gọi permission-logic trong component lá.

## Edge Cases
- `403` (chưa gán role) / `401` (token/account): query error → `permissions` giữ snapshot token (fallback), không crash. Không refetch lặp.
- `200 + permissions: []` (role inactive): `setPermissions([])` → mọi gate ẩn / `PermissionGuard` chặn (đúng — user mất quyền).
- Chưa fetch xong / offline: `permissions` = snapshot token → gate hoạt động theo bản cũ (không khóa nhầm nhờ fallback).
- `decodeToken` token thiếu `perm` → default `[]` (sẵn có) → `checkPermission` false an toàn.
- `user = null` (chưa login): `checkPermission`/`checkRole` false; màn đã ở luồng auth nên `PermissionGuard` không render ở đó.

## Acceptance Criteria
- [ ] `src/lib/authz.ts` export `P` (8 code), `checkPermission`, `checkRole` — type-safe (`as const`).
- [ ] `ENDPOINTS.AUTH.ME_PERMISSIONS === '/api/auth/me/permissions'`.
- [ ] Sau login, `/me/permissions` được gọi, `sessionStore.user.permissions` = code từ DB.
- [ ] CUSTOMER thiếu `ticket.create` → nút "Tạo ticket" ẩn; deep-link `tickets/create` → `PermissionGuard` chặn.
- [ ] STAFF thiếu `ticket.resolve` → nút Resolve ẩn. Nút **Escalate vẫn hiện** (không gate).
- [ ] Thiếu `user.view` → màn STAFF customers (tab + detail) bị chặn; thiếu `knowledge_base.view` → KB bị chặn; thiếu `battery.view` → battery detail bị chặn; thiếu `ticket.view` → ticket detail bị chặn.
- [ ] Đổi quyền role trên BE → invalidate `QUERY_KEY.permissions.me()` → gate cập nhật không cần login lại.
- [ ] `npx tsc --noEmit` PASS (không thêm route mới → không cần regenerate typed routes).

## Steps
- [x] Bước 1: `permission.types.ts` + `authz.ts` (P 8 code + checkPermission + checkRole) — 2026-06-22
- [x] Bước 2: `endpoints.ts` (ME_PERMISSIONS) + `queryKeys.ts` (permissions) + `sessionStore.setPermissions` — 2026-06-22
- [x] Bước 3: `permission.service.ts` (getMyPermissions) — 2026-06-22
- [x] Bước 4: `useMyPermissions.ts` + `PermissionsSync.tsx` + mount `app/_layout.tsx` + `PermissionGuard.tsx` — 2026-06-22
- [x] Bước 5: Gate action — `TicketActionBar` (canResolve) + `(staff)/tickets/[id].tsx` + `(customer)/(tabs)/tickets.tsx` — 2026-06-22
- [x] Bước 6: Guard read/create — wrap `PermissionGuard` vào 9 màn (create + customers×2 + kb×2 + battery×2 + ticket detail×2) — 2026-06-22
- [x] Bước 7: `npx tsc --noEmit` PASS — 2026-06-22

## Câu hỏi đã giải đáp
- **Map giữa token perm[] và /me/permissions?** Không phải 2 tập map chéo — cùng là permission code của role, khác độ tươi. Endpoint là bản tươi **đè** token; token là snapshot/fallback. `checkPermission` chính là phép map (membership `includes`).
- **Sync strategy:** Token init + endpoint đè (tươi) — đạt yêu cầu "đổi quyền invalidate là thấy".
- **P.\* form:** subset Mobile = 8 code (union default CUSTOMER+STAFF). Không mirror 43 (Simplicity First).
- **Gate Escalate:** BỎ — giữ behavior cũ (đã verify seed: staff không có `ticket.escalate`, gate sẽ ẩn nhầm).
- **Thêm guard create + gate read:** dùng `PermissionGuard` tái sử dụng cho create + các màn feature (user.view / knowledge_base.view / battery.view / ticket.view). `battery.update` + `notification.view` define nhưng chưa wire (không có target / là tab core).

## Verify BE (đọc source — 2026-06-22)
- `PermissionCodes.cs`: 41 const (+saga) — 8 code Mobile của plan tồn tại đúng tên.
- `PermissionSeed.RoleDefaults` (source of truth role-default):
  - STAFF: `user.view`, `battery.view`, `battery.update`, `ticket.view`, **`ticket.resolve`**, `notification.view`, `knowledge_base.view`.
  - CUSTOMER: `battery.view`, `ticket.view`, **`ticket.create`**, `notification.view`, `knowledge_base.view`.
  - `ticket.escalate` chỉ MANAGER/ADMIN → xác nhận lý do BỎ gate Escalate.
