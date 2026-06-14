# BÁO CÁO CODE REVIEW — feat/GH-23-customer-battery-detail — 2026-06-15

## TÓM TẮT
GH-23 thay màn Customer battery detail giả lập + mock `alertsStore` bằng API thật (detail/realtime/chart/alerts + acknowledge), consume base GH-24. Delta gọn (11 files, +313/−716 — chủ yếu xóa mock & code stub). `tsc --noEmit` PASS, eslint sạch (1 warning pre-existing ngoài scope). Code bám đúng pattern FE/mobile và base GH-24.

> Review trên delta thực GH-23: `git diff feat/GH-24-staff-battery-view` (không tính phần GH-24 vì branch stack).

## PHÂN TÍCH

### 🔴 Critical — ĐÃ FIX
- **[FIXED] Rò rỉ alert giữa các Customer** — ban đầu tab/dashboard/profile gọi `useAlerts()` = `GET /api/alerts` không kèm `batteryAssetId`. **Đã đọc BE xác minh:** `GetAlertsQueryHandler` (BatteryService) **không có** filter theo customer/user — chỉ `!IsDeleted` + các filter optional; `AlertsController` XML doc ghi rõ *"chưa có server-side filter để giới hạn Customer... FE/Mobile nên truyền BatteryAssetId"*. → Customer sẽ thấy alert của khách khác (data leak).
  **Fix:** tạo `useMyAlerts` — lấy pin Customer sở hữu (`useMyBatteryAssets`) → query alert từng `batteryAssetId` → gộp + sort `detectedAt` desc. Thay `useAlerts` ở cả 3 màn; xóa `useAlerts` (không còn dùng). Battery detail vẫn dùng `useAssetAlerts(batteryAssetId)` (an toàn sẵn). tsc + eslint PASS lại.

### 🟡 Warning
- **Phân trang alert** — list lấy cố định `pageSize: 100`, không infinite scroll. Đủ cho scope capstone nhưng sẽ cắt cụt nếu Customer có >100 alert. Chấp nhận trong scope, ghi nhận.
- **Mất tính năng read/unread + markAllAsRead** ở tab alerts (mock cũ có) — bỏ vì BE không có khái niệm "read". Thay bằng đếm theo `status===Open`. Đúng domain, không phải lỗi.

### ✅ Pass
- **Không gọi API trong component** — toàn bộ qua `services/` → TanStack Query hook (`useAlerts`, `useAcknowledgeAlert`, base GH-24). ✅
- **Endpoint single-source** — thêm `ALERTS.ACKNOWLEDGE` vào `endpoints.ts`, service dùng `ENDPOINTS.*`, không hardcode URL. ✅
- **Acknowledge mutation** — `mutateAsync` trong try/catch + `handleErrorApi({ error })` (non-form → Alert), `onSuccess` invalidate `KEY.alerts` → list + detail + dashboard count tự refresh. Nút disable khi `status !== Open` + khi `isPending`. 409 (Resolved/Merged) → toast, không đổi UI. ✅
- **Phân biệt 0 vs null** — realtime/reading dùng base components đã check `!= null` (BatteryRealtimeCard `fmt`). ✅
- **Enum chuẩn hóa** — `Failed:3`→`Decommissioned:3` khớp `api-battery.md`; sửa đồng bộ label ở BatteryInfoCard/profile/CreateTicketStepper. ✅
- **Realtime poll 30s** (base `useBatteryAssetRealtime`), chart svg aggregate 24h/1h — không thêm package. ✅
- **Query key factory** dùng `QUERY_KEY.alerts.list(params)` — 3 caller cùng params → share cache. ✅
- **tsc PASS**, eslint 0 error trên file thay đổi. ✅
- **Xóa sạch mock** `alertsStore.ts` — không còn tham chiếu. ✅

## RỦI RO & LƯU Ý
- **Branch stack:** `feat/GH-23` tạo từ `feat/GH-24`. PR phải target sau khi GH-24 merge vào `dev`, nếu không diff PR sẽ lẫn commit GH-24.
- **Phụ thuộc BE:** cần BE đã có `PATCH /api/alerts/{id}/acknowledge` + `GET /api/alerts/{id}/realtime` + sensor aggregate hoạt động để smoke test thật.
- **eslint warning** `react-hooks/exhaustive-deps` ở `dashboard.tsx` (EnergyFlowDiagram animation) — pre-existing, ngoài scope GH-23.

## KẾT LUẬN
**PASS (sau fix)** — Độ tự tin: **Cao**.
- Vòng 1: phát hiện 🔴 Critical (rò rỉ alert giữa Customer) — xác minh trực tiếp trong BE handler.
- Đã fix bằng `useMyAlerts` (scope theo pin Customer sở hữu) → tsc + eslint PASS.
- Khuyến nghị BE (issue riêng, ngoài GH-23): bổ sung server-side scope alert theo user cho Customer để defense-in-depth, vì hiện FE đang gánh việc filter.
