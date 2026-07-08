# Plan — GH-43: [Mobile] Notification Preferences (Customer + Staff)

## Metadata
- **Status:** REVIEWING | **Role:** Mobile (FE) | **Ngày:** 2026-06-22
- **Issue:** #43 — https://github.com/GSU26SE55/mobile/issues/43
- **Sprint:** Sprint 3 (due 2026-06-27)
- **Dev:** Trần Minh Trí

## Mục tiêu
Wire màn **Notification Preferences** cho mobile: load cài đặt thông báo của user (`GET /api/notification-preferences`) và lưu (`PUT /api/notification-preferences`) — toggle 4 kênh (push/email/sms/inApp) + quiet hours (HH:mm) + timezone. Dùng cho cả role **Customer** và **Staff**.

## Scope
**Trong scope:**
- `GET` + `PUT /api/notification-preferences` (M2 + M3).
- 1 component dùng chung `NotificationPreferencesForm` (logic fetch + mutate + UI) trong `src/features/notifications/`.
- 2 file route mỏng: Customer (qua settings hub) + Staff (qua profile entry point).
- Quiet hours nhập bằng `TextInput` định dạng `HH:mm`, validate Zod (không thêm package).

**Ngoài scope:**
- ❌ **M1 — Màn "Thiết bị đã đăng ký" (`GET /api/device-tokens`)** — loại theo quyết định (mobile không cần device list; nhu cầu bảo mật thiết bị đã do Sessions/Trusted-Devices cover).
- ❌ `POST /api/notifications` (Admin) — mobile không có role Admin.
- ❌ Field `frequency` (BE chưa expose qua endpoint).
- ❌ Receive/dispatch pipeline notification (scope riêng).

## Endpoints
| Method | Path | Request / Response |
|--------|------|--------------------|
| GET | `/api/notification-preferences` | Req: (none, `[Authorize]`) · Res: `CommonResponse<NotificationPreferenceDto>`. Chưa cấu hình → trả default (push/email/inApp=true, sms=false, quietHours=null, tz=`Asia/Ho_Chi_Minh`), **KHÔNG ghi DB**. |
| PUT | `/api/notification-preferences` | Req: `UpdateNotificationPreferencePayload` (4 bool + quietHoursStart/End nullable `"HH:mm"` + timeZone IANA) · Res: `CommonResponse<NotificationPreferenceDto>` (shape = GET). **Upsert** — chưa có record thì tạo mới (kể cả khi giá trị = default). |

> **Contract verify từ BE** (`backend/services/NotificationService/.../Preference/`): `NotificationPreferenceDto.cs`, `UpdateNotificationPreferenceCommand.cs` (`UserId` có `[JsonIgnore]`), `ValidateAsync()` chỉ check format `HH:mm` từng field. Không phải giả định doc.

## Enums
**Không dùng enum cho màn này.** 4 kênh là **boolean field độc lập** (`pushEnabled`/`emailEnabled`/`smsEnabled`/`inAppEnabled`), KHÔNG phải `NotificationChannelEnum`.
- `src/features/notifications/enums/notification.enum.ts` **đã tồn tại** (`NotificationChannelEnum`, `NotificationTypeEnum`, `DevicePlatformEnum`, …) nhưng **KHÔNG liên quan** màn preferences → không import, không sửa.

## Types
File mới `src/features/notifications/types/notification-preference.types.ts`. Field name + format khớp BE DTO (JSON camelCase):

```ts
// Response GET + PUT (shape giống nhau)
export interface NotificationPreferenceDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart: string | null;  // "HH:mm" | null
  quietHoursEnd: string | null;    // "HH:mm" | null
  timeZone: string;                // IANA, default "Asia/Ho_Chi_Minh"
}

// Body PUT — KHÔNG gửi userId (server set từ JWT, BE [JsonIgnore])
// Shape trùng DTO; tách type riêng cho rõ intent.
export type UpdateNotificationPreferencePayload = NotificationPreferenceDto;
```

## Schema (Zod)
File mới `src/features/notifications/schemas/notificationPreference.schema.ts`:

```ts
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;  // 00:00–23:59

export const notificationPreferenceSchema = z
  .object({
    pushEnabled:     z.boolean(),
    emailEnabled:    z.boolean(),
    smsEnabled:      z.boolean(),
    inAppEnabled:    z.boolean(),
    quietHoursStart: z.string().regex(HHMM, 'Định dạng phải là HH:mm').nullable(),
    quietHoursEnd:   z.string().regex(HHMM, 'Định dạng phải là HH:mm').nullable(),
    timeZone:        z.string().min(1, 'TimeZone không được trống').max(100, 'TimeZone tối đa 100 ký tự'),
  })
  // BE KHÔNG ép cặp (gửi 1 null 1 có vẫn nhận) → FE tự giữ invariant.
  .refine((v) => (v.quietHoursStart == null) === (v.quietHoursEnd == null), {
    message: 'Phải nhập cả giờ bắt đầu và kết thúc, hoặc tắt giờ im lặng',
    path: ['quietHoursEnd'],
  });

export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
```

> KHÔNG validate `start < end` — wrap-around qua đêm (22:00–07:00) là hợp lệ, BE chấp nhận.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/endpoints.ts` | modify | Thêm `NOTIFICATION_PREFERENCES: { BASE: '/api/notification-preferences' }` |
| `src/lib/queryKeys.ts` | modify | Thêm `KEY.notificationPreferences` + `QUERY_KEY.notificationPreferences.detail()` |
| `src/features/notifications/types/notification-preference.types.ts` | create | DTO + payload (xem §Types) |
| `src/features/notifications/schemas/notificationPreference.schema.ts` | create | Zod (xem §Schema) |
| `src/features/notifications/services/notification-preference.service.ts` | create | `get()`, `update(payload)` |
| `src/features/notifications/hooks/useNotificationPreferences.ts` | create | `useQuery` (get) + `useMutation` (update) + setQueryData onSuccess |
| `src/features/notifications/components/NotificationPreferencesForm.tsx` | create | Component dùng chung — fetch + form (4 Switch + quiet hours + timezone + Lưu) |
| `app/(customer)/settings/notifications.tsx` | create | Route mỏng → `return <NotificationPreferencesForm />` |
| `app/(customer)/settings/_layout.tsx` | modify | Thêm `<Stack.Screen name="notifications" options={{ title: 'Cài đặt thông báo' }} />` |
| `app/(customer)/settings/index.tsx` | modify | Thêm vào mảng `ITEMS`: `{ label: 'Cài đặt thông báo', route: '/(customer)/settings/notifications' }` |
| `app/(staff)/notification-preferences.tsx` | create | Route mỏng → `return <NotificationPreferencesForm />` |
| `app/(staff)/_layout.tsx` | modify | Thêm `<Stack.Screen name="notification-preferences" />` vào `<Stack>` |
| `app/(staff)/(tabs)/profile.tsx` | modify | Thêm `Pressable` "Cài đặt thông báo" (Ionicons `notifications-outline`) → `router.push('/(staff)/notification-preferences')`, đặt trước nút Đăng xuất |

## Approach
- **Component dùng chung:** toàn bộ logic + UI trong `NotificationPreferencesForm.tsx`; 2 file route `.tsx` chỉ `return <NotificationPreferencesForm />`.
- **Form (no React Hook Form — mobile.md):** local `useState` cho 4 bool + start/end string + timezone; validate bằng `schema.safeParse()` thủ công; lỗi field BE map qua `handleErrorApi({ error, setFieldError })`.
- **Cache:** `staleTime` 5 phút cho query; `onSuccess` của PUT ghi đè cache bằng DTO trả về (PUT trả full DTO) → tránh refetch.

### Workflow per-flow
**Load flow:**
```
Mount → useNotificationPreferences().pref (useQuery GET)
  isLoading → <ActivityIndicator>
  isError   → error state + nút "Thử lại" (refetch())   // 401 đã do axios interceptor xử lý
  data về   → useEffect(() => { if (data) setState(data) }, [data]) → fill form
  (chưa cấu hình → BE trả default → form hiển thị default)
```

**Save flow:**
```
Nhấn Lưu → build payload từ state (quiet hours OFF → start=end=null)
  → schema.safeParse(payload)
     FAIL → map issues vào fieldErrors (KHÔNG gọi API)
     PASS → mutateAsync(payload)  // PUT
        OK   → onSuccess: setQueryData(DTO trả về) + toast "Đã lưu cài đặt"
        FAIL → catch → handleErrorApi({ error, setFieldError })  // HH:mm / timeZone từ BE
```

**Toggle quiet hours flow:**
```
Switch "Bật giờ im lặng"
  OFF → ẩn 2 TextInput, state quietHoursStart = quietHoursEnd = null
  ON  → hiện 2 TextInput, prefill "22:00"/"07:00" (giữ invariant cùng-có-giá-trị)
```

## Edge Cases
- **Chưa cấu hình:** GET trả default → form hiển thị default, không lỗi, không tạo record (record chỉ tạo khi Lưu).
- **Lưu mà không đổi gì:** PUT vẫn upsert → BE tạo record default mới. Hành vi đúng (đã verify handler), không phải bug.
- **Quiet hours sai định dạng:** Zod chặn (`HHMM`) → lỗi field, không gọi PUT. BE cũng trả `"Định dạng phải là HH:mm."` → map field (double guard).
- **Bật quiet hours nhưng thiếu 1 ô / lệch cặp:** `.refine()` chặn FE (BE không ép cặp).
- **Quiet hours qua đêm (22:00–07:00):** hợp lệ — không validate start<end.
- **timeZone rỗng / >100 ký tự:** Zod chặn (default `Asia/Ho_Chi_Minh`).
- **400 thiếu claim UserId / 401:** axios interceptor xử lý refresh/logout; lỗi nghiệp vụ còn lại → toast qua `handleErrorApi`.
- **GET lỗi (network/500, non-401):** TanStack Query `isError` → màn hiển thị error state + nút "Thử lại" (`refetch()`), không crash form.

## Acceptance Criteria
- [ ] GET nạp đúng preference vào form; user chưa cấu hình → hiển thị default (push/email/inApp ON, sms OFF, không quiet hours, tz `Asia/Ho_Chi_Minh`) và **không tạo record DB**.
- [ ] Toggle 4 kênh + Lưu → PUT body khớp contract (camelCase, không có `userId`); thành công cập nhật UI + thông báo. Lưu lần đầu **tạo record** (upsert).
- [ ] Quiet hours: nhập `HH:mm` hợp lệ lưu được; sai định dạng/lệch cặp → lỗi field, không gọi API; tắt → gửi `null/null`; wrap-around 22:00–07:00 lưu được.
- [ ] Customer mở màn qua settings hub; Staff mở qua entry point ở profile.
- [ ] **Quality gate PASS:** `npx tsc --noEmit` + `npm run lint` (expo lint).

> **Quality gate mobile:** chỉ `tsc --noEmit` + `npm run lint` (`expo lint` / `eslint-config-expo`). Mobile **KHÔNG** có `npm run build` như web (fe.md §Quality Gates) — Expo managed build qua EAS, không phải code gate. `/kltn-test` và `/kltn-ship` chạy đúng 2 lệnh này, không chờ `npm run build`.

## Steps
- [x] Bước 1: Types — `notification-preference.types.ts` + thêm `endpoints.ts` (NOTIFICATION_PREFERENCES) + `queryKeys.ts` (notificationPreferences) — 2026-06-22
- [x] Bước 2: Schema — `notificationPreference.schema.ts` (Zod HH:mm + `.refine()` cặp quiet hours + timezone) — 2026-06-22
- [x] Bước 3: Service — `notification-preference.service.ts` (`get`, `update`) — 2026-06-22
- [x] Bước 4: Hook — `useNotificationPreferences.ts` (query + mutation + setQueryData onSuccess) — 2026-06-22
- [x] Bước 5: Component dùng chung — `NotificationPreferencesForm.tsx` (load flow + 4 Switch + quiet hours toggle + timezone + Lưu) — 2026-06-22
- [x] Bước 6: Routes — customer `settings/notifications.tsx` (+ `<Stack.Screen>` vào `_layout` + item vào `ITEMS`); staff `notification-preferences.tsx` (+ `<Stack.Screen>` vào `(staff)/_layout` + `Pressable` entry vào `(tabs)/profile.tsx`) — 2026-06-22
- [x] Bước 7: Quality gate → `npx tsc --noEmit` PASS (0 lỗi) + `npm run lint` file mới 0 errors (mobile không có `npm run build`) — 2026-06-22

> **Lưu ý implement:** route mới làm expo-router typed routes lag → đã regenerate `.expo/types/router.d.ts` (chạy `expo start --port 8090` rồi dừng). Cần làm lại nếu fresh checkout chạy tsc trước khi start dev server.

## Follow-up (2026-06-23) — Notification read-state + list UI
BE `NotificationService` đã bổ sung read-state (mark-as-read trước đây tách issue #588, nay đã có). Verify trực tiếp `NotificationsController.cs` — doc `api-notification.md` **stale** (chưa ghi 3 endpoint dưới):

| Method | Route | Response |
|--------|-------|----------|
| PATCH | `/api/notifications/{id}/read` | `CommonResponse<string>` (idempotent 200; 404 nếu ko thuộc user) |
| POST | `/api/notifications/read-all` | `CommonResponse<number>` (số đã mark) |
| GET | `/api/notifications/unread-count` | `CommonResponse<number>` (badge) |

**SignalR — KHÔNG cần.** `NotificationService` không có hub (toàn BE chỉ `TicketCommentHub` + `SmsGatewayHub`). Notification dùng polling — `useUnreadCount` `refetchInterval` 30s.

**Files (follow-up):**
| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/endpoints.ts` | modify | `NOTIFICATIONS.MARK_READ(id)` · `MARK_ALL_READ` · `UNREAD_COUNT` |
| `src/lib/queryKeys.ts` | modify | `notifications.unreadCount()` |
| `src/features/notifications/services/notification.service.ts` | modify | `markRead`, `markAllRead`, `getUnreadCount` |
| `src/features/notifications/hooks/useNotifications.ts` | modify | `useUnreadCount` (poll 30s) + `useMarkNotificationRead` + `useMarkAllRead` (onError `handleErrorApi`) |
| `src/features/notifications/components/NotificationList.tsx` | create | Shared list: action row "N chưa đọc" + "đánh dấu tất cả đã đọc", FlatList + loading/empty/error, tap → markRead + deep-link qua prop `ticketHref` |
| `app/(staff)/(tabs)/notifications.tsx` | modify | **Bỏ MOCK_NOTIFICATIONS**, render `<NotificationList>` (deep-link staff) |
| `app/(customer)/settings/notification-list.tsx` | create | Màn list cho Customer (deep-link customer) |
| `app/(customer)/settings/_layout.tsx` + `index.tsx` | modify | `<Stack.Screen name="notification-list">` + item "Thông báo" |
| `app/(staff)/(tabs)/_layout.tsx` | modify | Badge unread trên tab "Thông báo" (`useUnreadCount`) |

**Acceptance:** bỏ mock, tap→mark read + deep-link, mark-all-read, badge staff tab, customer list từ settings; `tsc --noEmit` + `npm run lint` PASS.

## Câu hỏi đã giải đáp
- **Device list (M1)?** → Bỏ khỏi scope (cả customer & staff không cần; bảo mật thiết bị thuộc Sessions/Trusted-Devices).
- **Scope role?** → Customer + Staff.
- **Cách dựng cho staff (chưa có settings hub)?** → Shared component + thin routes mỗi group (logic 1 chỗ).
- **Quiet hours input?** → `TextInput HH:mm` + Zod, không thêm package.
- **[BE-verified] Lưu khi chưa cấu hình tạo record?** → Có, PUT upsert luôn tạo record (kể cả default). GET không tạo. Không mâu thuẫn.
- **[BE-verified] Quiet hours wrap-around?** → BE chấp nhận (chỉ check format từng field, không check start<end, không ép cặp) → FE tự ép cặp bằng `.refine()`.
