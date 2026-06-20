# Plan — GH-36: [Mobile] Notification — sync contract với BE + Device Tokens + mark-read

## Metadata
- **Status:** REVIEWING | **Role:** Mobile (FE) | **Ngày:** 2026-06-20
- **Issue:** #36 — https://github.com/GSU26SE55/mobile/issues/36
- **Sprint:** Sprint 3 (due 2026-06-27)

## Mục tiêu
Đồng bộ module Notification của mobile với contract BE thật (`docs/api-notification.md`):
1. Thêm module `/api/device-tokens` (POST register + DELETE unregister) và wire `expo-notifications` ở mức **token lifecycle** (xin permission → lấy Expo push token → register sau login → unregister khi logout).
2. **Bỏ** tính năng mark-read khỏi mobile (BE không có endpoint `/read` & `/read-all`).
3. Sửa `NotificationDTO` + enum (string → int) + list params cho khớp BE; suy `unread` từ `status`.

Output: notification list gọi BE thật parse đúng; device token được đăng ký/hủy theo phiên đăng nhập; không còn call 404.

## Scope
**Trong scope:**
- Cài `expo-notifications` (token lifecycle). **KHÔNG** thêm `expo-device` — `deviceInfo` dựng từ `Platform` built-in của React Native.
- `POST /api/device-tokens` (register) + `DELETE /api/device-tokens` (unregister) — service + types + helper push.
- Wire register vào `useLogin`, unregister vào `useLogout` (best-effort, non-blocking).
- Viết lại `notification.enum.ts` (int-based: Type 18 giá trị + System=99, Status, Channel, DevicePlatform).
- Viết lại `NotificationDTO` + `NotificationListParams` khớp BE; helper `isUnread()`.
- Sửa `notification.service.ts` (bỏ markRead/markAllRead), `endpoints.ts`, `NotificationCard.tsx`, màn staff notifications.
- Xóa `useMarkNotificationRead.ts` + nút "Đọc tất cả".

**Ngoài scope:**
- `GET /api/device-tokens` + màn "thiết bị đã đăng ký" (optional — bỏ qua).
- Pipeline nhận/hiển thị push (foreground handler, tap→deep-link, badge) — issue riêng sau.
- BE bổ sung mark-read (nếu cần sau này → issue ở backend repo).
- `docs/api-notification.md` — **đã byte-identical với backend, không cần sửa** (xem §Ghi chú kiểm chứng).

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `package.json` | modify | `npx expo install expo-notifications` (chỉ 1 package mới) |
| `src/lib/endpoints.ts` | modify | Bỏ `NOTIFICATIONS.READ/READ_ALL`; thêm `DEVICE_TOKENS: { BASE: '/api/device-tokens' }` |
| `src/lib/push.ts` | create | `getExpoPushToken()` (xin permission + lấy token), `getDeviceInfo()` (từ `Platform`) |
| `src/features/notifications/enums/notification.enum.ts` | modify | Viết lại int-based: `NotificationTypeEnum`, `NotificationStatusEnum`, `NotificationChannelEnum`, `DevicePlatformEnum` |
| `src/features/notifications/types/notification.types.ts` | modify | `NotificationDTO` mới + `NotificationListParams` mới + helper `isUnread()` |
| `src/features/notifications/types/device-token.types.ts` | create | `RegisterDeviceTokenPayload`, `UnregisterDeviceTokenPayload` |
| `src/features/notifications/services/notification.service.ts` | modify | Bỏ `markRead`/`markAllRead`; giữ `getList` |
| `src/features/notifications/services/device-token.service.ts` | create | `register(payload)`, `unregister(token)` |
| `src/features/notifications/hooks/useMarkNotificationRead.ts` | delete | BE không có endpoint |
| `src/features/auth/hooks/useLogin.ts` | modify | Sau `setSession`: best-effort register device token |
| `src/features/auth/hooks/useLogout.ts` | modify | Trước `clearTokens`: best-effort unregister device token |
| `src/features/notifications/components/NotificationCard.tsx` | modify | `ICON_MAP` theo int type; dùng `isUnread()`; deep-link `entityType`/`entityId` |
| `app/(staff)/(tabs)/notifications.tsx` | modify | Bỏ mark-read + nút "Đọc tất cả"; sửa `MOCK`/`unreadCount`/`handlePress` theo DTO mới |

## Enums
| Enum | File nguồn | Giá trị (int — khớp BE) |
|------|-----------|--------------------------|
| `NotificationTypeEnum` | `features/notifications/enums/notification.enum.ts` | TicketCreated=1, TicketAssigned=2, TicketStatusChanged=3, TicketResolved=4, TicketClosed=5, TicketEscalated=6, SlaWarning=7, SlaBreached=8, BatteryAnomalyDetected=9, EnvironmentalIncidentDetected=10, EnvironmentalIncidentResolved=11, AccountActivated=12, AdminInvite=13, IncidentDeclared=14, BatteryAlertEscalationPending=16, AlertTicketSagaFailed=17, IotDeviceWentOffline=18, System=99 |
| `NotificationStatusEnum` | `features/notifications/enums/notification.enum.ts` | Pending=1, Sent=2, Failed=3, Read=4 |
| `NotificationChannelEnum` | `features/notifications/enums/notification.enum.ts` | Push=1, Email=2, Sms=3, InApp=4 |
| `DevicePlatformEnum` | `features/notifications/enums/notification.enum.ts` | Ios=1, Android=2, Web=3 |

> Pattern `as const` object + type alias (theo fe.md/mobile.md) — **không** dùng TypeScript native `enum`. Giá trị `15` bị skip ở BE → mobile cũng skip.

## Types
```ts
// notification.types.ts — import enum từ enums/, dùng làm type
interface NotificationDTO {
  id: string; userId: string;
  type: NotificationTypeEnum;          // int
  channel: NotificationChannelEnum;    // int
  status: NotificationStatusEnum;      // int
  title: string; body: string;
  payloadJson: string | null;
  entityType: string | null;           // 'Ticket' | 'Battery' | ...
  entityId: string | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}
const isUnread = (n: NotificationDTO) => n.status !== NotificationStatusEnum.Read;

interface NotificationListParams {
  pageNumber?: number; pageSize?: number;
  type?: NotificationTypeEnum; channel?: NotificationChannelEnum;
  status?: NotificationStatusEnum; unreadOnly?: boolean;
}

// device-token.types.ts
interface RegisterDeviceTokenPayload { token: string; platform: DevicePlatformEnum; deviceInfo?: string; }
interface UnregisterDeviceTokenPayload { token: string; }
```

## Schema (Zod)
**N/A** — issue này không có form input:
- Notification list: chỉ GET + render, không có form.
- Device-token register/unregister: payload dựng tự động từ `expo-notifications` + `Platform`, không phải user nhập → validate ở BE. Không cần Zod schema phía mobile.

## Endpoints
| Method | Path | Mục đích / Request / Response |
|--------|------|-------------------------------|
| GET | `/api/notifications` | List notis của user. Params: `pageNumber, pageSize, type?, channel?, status?, unreadOnly?`. Resp: `CommonResponse<PaginationResponse<NotificationDTO>>` |
| POST | `/api/device-tokens` | Register push token. Body: `{ token, platform (1=Ios/2=Android/3=Web), deviceInfo? }`. Resp: `CommonResponse<string>` *(BE doc ghi `CommonResponse<Guid>`; Guid serialize thành string qua JSON → type mobile dùng `string`)*. Status 201/200/409 |
| DELETE | `/api/device-tokens` | Unregister. Body: `{ token }`. Resp: `CommonResponse<string>` *(Guid→string)*. Status 200/404 |
| ~~PATCH `/notifications/{id}/read`~~ | — | **XÓA** — BE không có |
| ~~PATCH `/notifications/read-all`~~ | — | **XÓA** — BE không có |

## Workflow

**Register device token (login flow):**
```
useLogin.onSuccess → saveTokens → setSession → router.replace(dest)
  → (best-effort, không await chặn) getExpoPushToken()
      → null (denied / simulator)  → skip, không lỗi
      → token                       → deviceTokenService.register({ token, platform, deviceInfo })
                                         → 201/200/409 đều coi là OK
                                         → fail → nuốt lỗi (try/catch)
```

**Unregister device token (logout flow):**
```
useLogout.mutationFn → getExpoPushToken()
      → token → deviceTokenService.unregister({ token })  (try/catch best-effort)
      → null  → skip
   → authService.logout(refreshToken) (best-effort sẵn có) → clearTokens → clearSession
useLogout.onSuccess → router.replace('/(auth)/login')
```

**Render notification list:**
```
useNotifications(params) → GET /api/notifications → data.items: NotificationDTO[]
  → NotificationCard: ICON_MAP[type] (fallback System) · isUnread(n) → style + dot
  → onPress: entityType==='Ticket' && entityId → router.push('/(staff)/tickets/[id]', { id: entityId })
```

## Edge Cases
- Push permission bị từ chối / chạy trên simulator (không có token) → `getExpoPushToken()` trả `null`, **skip** register, không báo lỗi chặn login.
- Register/unregister API fail → nuốt lỗi (best-effort), luồng login/logout vẫn hoàn tất.
- `POST` trả 409 (token đã active) → coi như thành công, không hiển thị lỗi.
- Notification list rỗng `items: []` → empty state (không phải lỗi).
- `entityId`/`entityType` null → card không deep-link, chỉ hiển thị.
- `type` không nằm trong ICON_MAP → fallback icon `System`.

## Acceptance Criteria
- [ ] `npx tsc --noEmit` PASS (không còn ref tới `isRead`/`referenceId`/`markRead`).
- [ ] `NotificationDTO` + 4 enum khớp `docs/api-notification.md`.
- [ ] `GET /api/notifications` parse đúng field int (`type/channel/status`) và render card; unread suy từ `status`.
- [ ] Không còn import/usage `useMarkNotificationRead`, `NOTIFICATIONS.READ/READ_ALL`, nút "Đọc tất cả".
- [ ] Login → gọi `POST /api/device-tokens` với `{ token, platform, deviceInfo? }` (khi có permission); Logout → gọi `DELETE /api/device-tokens`.
- [ ] Permission denied / không có token → login/logout vẫn hoạt động bình thường.
- [ ] `expo-notifications` thêm vào `package.json` qua `expo install` (không thêm `expo-device`).

## Steps
- [x] Bước 1 (Types/Enums): viết lại `notification.enum.ts` (int) + `notification.types.ts` + `device-token.types.ts` — 2026-06-20
- [x] Bước 2 (Endpoints): sửa `endpoints.ts` (bỏ READ/READ_ALL, thêm DEVICE_TOKENS) — 2026-06-20
- [x] Bước 3 (Service): sửa `notification.service.ts`; tạo `device-token.service.ts`; xóa `useMarkNotificationRead.ts` — 2026-06-20
- [x] Bước 4 (Push helper): cài `expo-notifications`; tạo `src/lib/push.ts` (token + deviceInfo từ `Platform`) — 2026-06-20
- [x] Bước 5 (Wire auth): register trong `useLogin` **+ `useVerify2faLogin`**, unregister trong `useLogout` (best-effort) — 2026-06-20
- [x] Bước 6 (Component + Page): sửa `NotificationCard.tsx` + `app/(staff)/(tabs)/notifications.tsx` — 2026-06-20
- [x] Bước 7 (Verify): `npx tsc --noEmit` → chỉ còn 1 lỗi **pre-existing** ngoài scope (`customers.tsx:146`); eslint changed-files chỉ còn warning `no-redeclare` theo pattern enum bắt buộc (toàn project đều có) — 2026-06-20

## Thay đổi so với plan (ghi nhận khi implement)
- **Thêm `useVerify2faLogin.ts`** vào danh sách wire register: đây là path hoàn tất login thứ 2 (2FA). Để tránh bỏ sót đăng ký token cho user bật 2FA, gom logic best-effort vào `syncDeviceTokenOnLogin()` / `syncDeviceTokenOnLogout()` trong `device-token.service.ts` và gọi từ cả 3 hook (`useLogin`, `useVerify2faLogin`, `useLogout`). Thay đổi nhỏ, không đổi scope/approach.
- **`expo-constants`** đã có sẵn (không phải package mới) — dùng đọc EAS `projectId` cho `getExpoPushTokenAsync`.
- **Lỗi ngoài scope:** `app/(staff)/(tabs)/customers.tsx:146` (typed-routes) đã tồn tại từ trước GH-36, KHÔNG sửa (surgical changes).

## Ghi chú kiểm chứng (cho reviewer)
- **Docs byte-identical** — đã verify, KHÔNG phải assertion. Backend docs có trong workspace (additional working dir `/Users/shu/Documents/GSU26SE55/backend/docs`). Lệnh:
  ```
  diff -q docs/api-notification.md /Users/shu/Documents/GSU26SE55/backend/docs/api-notification.md
  # → IDENTICAL (exit 0)
  ```
  Vì vậy item #4 không cần sửa file nào.
- **`expo-notifications`** đã nằm trong stack chính thức (mobile.md §Stack — Notifications) → Leader duyệt sẵn. **`expo-device` bị loại** để tránh thêm package ngoài stack; `deviceInfo` dùng `Platform.OS`/`Platform.Version` built-in.

## Câu hỏi đã giải đáp
1. **Mark-read (BE không có endpoint)** → **Bỏ hẳn khỏi mobile** (xóa hook/service/endpoint/nút). Unread suy từ `status===Read`.
2. **Phạm vi expo-notifications** → **Chỉ token lifecycle** (permission + Expo token + register/unregister theo login/logout). Không làm pipeline nhận/hiển thị push.
3. **GET /api/device-tokens + màn quản lý thiết bị** → **Ngoài scope**.
4. **`docs/api-notification.md`** → đã verify byte-identical với backend (xem §Ghi chú kiểm chứng), **không cần sửa**.
5. **`expo-device`** → **loại bỏ**, dùng `Platform` built-in. Chỉ thêm `expo-notifications` (đã trong stack chính thức).
