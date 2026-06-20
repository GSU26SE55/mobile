## BÁO CÁO CODE REVIEW — feat/GH-36-sync-notification-contract — 2026-06-20

### TÓM TẮT
Đồng bộ contract Notification + thêm device-token lifecycle. Code khớp BE docs, theo đúng pattern fe.md/mobile.md, type-check sạch (chỉ còn 1 lỗi pre-existing ngoài scope). Có **1 vấn đề UX nên fix trước ship** (xin permission khi logout) + vài lưu ý nhỏ. Tổng thể đạt.

### PHÂN TÍCH

🟡 **Warning — `device-token.service.ts:syncDeviceTokenOnLogout` (qua `push.ts:getExpoPushToken`)**
Khi logout, `getExpoPushToken()` gọi `requestPermissionsAsync()` nếu permission **chưa** granted → user chưa từng bật push mà bấm logout sẽ bị **hiện popup xin quyền notification ngay lúc đăng xuất** (UX sai).
→ **Fix:** logout chỉ nên đọc token khi quyền **đã** granted, không request. Ví dụ tách tham số:
```ts
export async function getExpoPushToken(opts?: { requestPermission?: boolean }): Promise<string | null> {
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    if (opts?.requestPermission === false) return null;   // logout → không prompt
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  ...
}
// logout: getExpoPushToken({ requestPermission: false })
```

🟡 **Warning — `notifications.tsx` MOCK_NOTIFICATIONS fallback**
`notifications = apiData?.items ?? MOCK_NOTIFICATIONS` → khi API **lỗi**, màn hiển thị data giả thay vì empty/error state (che lỗi thật). Hành vi này có sẵn từ trước GH-36, giữ theo plan, nhưng nên gỡ mock khi API ổn định để không che lỗi production.

🟡 **Warning — `useNotifications()` gọi không truyền params**
Màn staff gọi `useNotifications()` (không param) → luôn page 1, size 10 mặc định BE, chưa hỗ trợ phân trang/filter (`unreadOnly`, `type`,…). Đúng scope hiện tại (chỉ list cơ bản); ghi nhận để mở rộng sau nếu cần infinite scroll.

✅ **Pass:**
- Enum int khớp BE 1:1 (Type 18 giá trị + skip 15 + System=99, Status, Channel, DevicePlatform). Pattern `as const` + type alias đúng fe.md.
- `NotificationDTO` đủ field BE (`channel/status/payloadJson/entityType/entityId/sentAt/readAt`); bỏ `isRead/referenceId/referenceType`. `isUnread()` suy từ `status !== Read` — khớp semantics `unreadOnly` của BE.
- `endpoints.ts`: bỏ READ/READ_ALL (endpoint ma 404), thêm `DEVICE_TOKENS.BASE`. Không còn ref mark-read trong toàn bộ codebase.
- `NotificationCard`: `Partial<Record<...>>` + `FALLBACK_ICON` xử lý đúng type không có trong map. Deep-link đổi sang `entityType/entityId`.
- Device-token: `register` POST body `{token,platform,deviceInfo}`, `unregister` DELETE body `{token}` — đúng contract. Type `CommonResponse<string>` (Guid→string) chú thích rõ.
- Wire best-effort `void syncDeviceTokenOnLogin()` ở cả `useLogin` + `useVerify2faLogin` (không sót path 2FA); logout gọi unregister **trước** clearTokens (token còn hợp lệ). Tất cả try/catch nuốt lỗi — không chặn auth.
- `getExpoPushToken` graceful trả `null` khi denied/simulator/thiếu projectId.
- `tsc`: chỉ còn `customers.tsx:146` (pre-existing, ngoài diff GH-36). `eslint`: chỉ warning `no-redeclare` thuộc pattern enum bắt buộc (toàn project đều có).
- Chỉ thêm 1 package `expo-notifications` (đã trong stack chính thức); `expo-constants` đã có sẵn.

### RỦI RO & LƯU Ý
- **Inert cho tới khi có EAS `projectId`:** chưa cấu hình `projectId` trong `app.json` → `getExpoPushToken` luôn `null` → chưa máy nào đăng ký token thật. Cần `eas init` + thêm `extra.eas.projectId` (prerequisite, ngoài scope GH-36).
- **DELETE có body:** axios gửi body qua `{ data }` — đúng với contract BE, nhưng một số proxy strip DELETE body; xác nhận khi test integration.
- **Push receive pipeline** (banner/tap/badge) + **BE Dispatcher gửi Expo** chưa có → noti chưa tới máy thật. Là scope riêng, đã thống nhất tách issue sau.
- Khi ship: **loại trừ** các file ngoài GH-36 đang dirty (`docs/api-*.md`, `logs/GH-37/`).

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**.
Không có Critical. Khuyến nghị fix 🟡 #1 (permission-on-logout) trước `/kltn-ship` vì dễ và là UX bug rõ ràng; 2 warning còn lại chấp nhận được trong scope.
