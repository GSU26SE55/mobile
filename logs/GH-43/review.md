# BÁO CÁO CODE REVIEW — feat/GH-43-notification-preferences — 2026-06-22

## TÓM TẮT
Wire màn Notification Preferences (GET/PUT) cho Customer + Staff qua 1 component dùng chung + 2 route mỏng. Code bám sát pattern hiện có (service → hook TanStack Query, Zod safeParse thủ công, handleErrorApi), không thêm package, contract khớp BE đã verify. Quality gate PASS (tsc 0 lỗi, eslint file mới 0 errors). **Đạt chuẩn ship.**

## PHÂN TÍCH

### ✅ Pass
- **Kiến trúc:** không gọi API trong component — qua `services/notification-preference.service.ts` → `useNotificationPreferences` (TanStack Query). Đúng rule.
- **Contract:** types khớp BE DTO (camelCase, `quietHours*: string|null`, không gửi `userId`). Verify từ `NotificationPreferenceDto.cs` / `UpdateNotificationPreferenceCommand.cs`.
- **Schema:** Zod `HHMM` regex + `.refine()` ép cặp quiet hours (BE không ép → FE chủ động giữ invariant). Không validate start<end (wrap-around hợp lệ).
- **Error handling:** form dùng `safeParse` → `setFieldErrors` cho lỗi client; `try/catch mutateAsync` + `handleErrorApi({ error, setFieldError })` cho lỗi BE. Key field BE PascalCase → `handleErrorApi` normalize camelCase, **khớp** key `fieldErrors` (`quietHoursStart`/`quietHoursEnd`/`timeZone`).
- **Load/error states:** `isLoading` → spinner; `isError` → "Thử lại" (`refetch`); chưa cấu hình → BE default fill form.
- **Cache:** PUT `onSuccess` `setQueryData` bằng DTO trả về → tránh refetch.
- **Reuse:** 1 component, 2 route `.tsx` mỏng (customer settings hub + staff profile entry). Logic 1 chỗ.
- **Enums:** không tạo enum thừa; `notification.enum.ts` sẵn có không bị đụng.
- **Endpoints/queryKeys:** thêm `NOTIFICATION_PREFERENCES.BASE` + `notificationPreferences.detail()` đúng vị trí single-source.
- **Surgical:** chỉ touch file trong plan; không refactor lân cận.
- **Typed routes:** `.expo/types/router.d.ts` đã regenerate → tsc nhận route mới.

### 🟡 Warning (không chặn ship)
- `app/(staff)/(tabs)/profile.tsx:6` — import `ShadowPrimary` không dùng (eslint warning). **Pre-existing**, không do GH-43 (tôi dùng `Shadow`). Để nguyên theo nguyên tắc Surgical Changes; có thể dọn ở chore riêng.
- `NotificationPreferencesForm.tsx` — quiet hours là `TextInput` `HH:mm` thủ công (không mask/time-picker) và `timeZone` free-text (chỉ validate length, không validate IANA hợp lệ). Đúng phạm vi plan (không thêm package); UX có thể nâng cấp sau nếu cần.
- Sau khi lưu, `setQueryData` đổi `pref.data` → `useEffect` re-fill state form. Idempotent, không gây lệch; chỉ lưu ý hành vi.

### 🔴 Critical
- Không có.

## RỦI RO & LƯU Ý
- Màn chỉ hoạt động đúng end-to-end khi BE dispatcher đọc preference khi gửi (Sprint 6+) — ngoài scope GH-43.
- Push thực sự còn cần EAS `projectId` + receive pipeline (mobile) và mark-as-read (BE #588) — đã tách issue riêng, không thuộc ticket này.
- Test thực tế cần thiết bị/giả lập có đăng nhập (GET/PUT cần JWT) — chuyển sang `/kltn-test`.

## KẾT LUẬN
**PASS** — Độ tự tin: **Cao**.
Đề xuất: chạy `/kltn-test 43`.

---

# BỔ SUNG REVIEW — Follow-up: Notification read-state + list UI — 2026-06-23

## TÓM TẮT
BE `NotificationService` đã có read-state (mark-as-read trước tách #588). Wire 3 endpoint
(`PATCH /{id}/read`, `POST /read-all`, `GET /unread-count`) + UI: shared `NotificationList`, staff tab
(bỏ mock), màn list Customer, badge unread tab staff. `tsc --noEmit` **0 lỗi**, `npm run lint` **0 error**
(48 warning đều **pre-existing** ở file khác — ticket.types/enum redeclare, không thuộc file thay đổi). **PASS.**

## SignalR? — KHÔNG cần
Toàn backend chỉ 2 hub (`TicketCommentHub`, `SmsGatewayHub`) — `NotificationService` không có hub. Mobile
có `@microsoft/signalr` nhưng chỉ dùng cho ticket comments (`useTicketCommentsRealtime.ts`, GH-44).
Notification theo pull → polling `useUnreadCount` (`refetchInterval` 30s).

## PHÂN TÍCH

### 🔴 Critical
- Không có.

### 🟡 Warning / Lưu ý
- 🟡 Doc BE `api-notification.md` **stale** (thiếu 3 endpoint read-state) — dùng `NotificationsController.cs`
  làm nguồn chuẩn. Đáng đề xuất issue `role: BE` cập nhật doc.
- 🟡 Route mới `notification-list` cần regenerate `.expo/types/router.d.ts` (đã chạy `expo start` 1 lần,
  như note GH-43). Fresh checkout chạy tsc trước khi start dev server sẽ báo lỗi typed-route → start 1 lần.
- 🟡 Customer không có notif tab → badge chỉ ở staff tab; Customer thấy unread qua action row trong màn list.

### ✅ Pass
- **Bỏ mock:** `MOCK_NOTIFICATIONS` + fallback ở staff tab đã xóa sạch (grep `mock` trong notifications = 0).
- **Architecture:** không gọi API trong component — qua `notification.service` → hook TanStack Query.
- **Reuse:** 1 `NotificationList` dùng cho cả staff tab + customer route (pattern "shared component + thin
  route" như preferences GH-43); `NotificationCard`/`isUnread`/enums tái dùng, không tạo trùng.
- **Error handling:** mark-read/all là non-form → `onError: handleErrorApi({ error })` (Alert). Không tự Alert
  trong hook.
- **Query keys/endpoints:** `notifications.unreadCount()` + 3 endpoint qua `ENDPOINTS`, không hardcode URL.
  Mark-read/all invalidate `KEY.notifications` (bao cả list + unread-count).
- **Deep-link:** `ticketHref` prop theo role — staff `/(staff)/tickets/[id]`, customer `/(customer)/tickets/[id]`
  (cả 2 route tồn tại). Badge `overflow:hidden` của icon được né bằng cách render badge ở Pressable wrapper.
- **Surgical:** chỉ touch file trong plan follow-up; không refactor lân cận.

## RỦI RO & LƯU Ý
- Badge trễ tối đa 30s (polling) — không có server-push để realtime.
- Chưa kiểm thử runtime với BE thật + seed noti (chỉ static gate).

## KẾT LUẬN (Follow-up)
**PASS** — Độ tự tin: **Cao**. tsc/lint xanh; contract verify trực tiếp controller; SignalR xác nhận
không cần; bỏ sạch mock; theo đúng pattern repo.
