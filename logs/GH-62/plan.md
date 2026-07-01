# Plan — GH-62: [Mobile] Cross-device 2FA confirm (#AUTH-51)

## Metadata
- **Status:** IMPLEMENTING (retro — plan viết sau khi code đã tồn tại; UI/flow CHƯA làm) | **Role:** Mobile | **Ngày:** 2026-07-01
- **Issue:** #62 — https://github.com/GSU26SE55/mobile/issues/62
- **Branch:** `chat_full` (không theo naming convention `feat/GH-[number]-slug`)
- **Commit:** `40f6996` — feat: add login history and cross-device 2FA functionality (phần cross-device 2FA)

> ⚠️ **Ghi chú quy trình:** Plan viết SAU khi code đã có. Quan trọng hơn: `logs/GH-37/plan.md` (đã approved trước đó) **loại rõ #AUTH-51 khỏi scope mobile** với lý do "mobile không có camera-from-web flow". Commit này đảo ngược quyết định đó mà không có plan/thảo luận nào ghi lại — cần Leader/BE xác nhận trước khi đi tiếp (xem "Câu hỏi chưa giải đáp").

## Mục tiêu
2 endpoint cross-device 2FA confirm: Device A (đang ở màn login, có `challengeToken`) gửi request; Device B (đã đăng nhập sẵn, có TOTP) confirm hộ.

## Scope (đã làm)
- `POST /api/auth/2fa/cross-device-confirm/request` — Device A gửi `{ challengeToken }` → `{ requestId, expiresInSeconds }`.
- `POST /api/auth/2fa/cross-device-confirm` — Device B gửi `{ requestId, totpCode }`.
- Types + service + 2 mutation hook (`useRequestCrossDevice2fa`, `useConfirmCrossDevice2fa`).

## Scope (CHƯA làm — chặn trước khi ship)
- **UI/screen cho cả 2 phía** (Device A hiển thị chờ + cách nào đó truyền `requestId` sang Device B; Device B màn nhập `requestId` + TOTP). Không có màn hình nào import 2 hook trên.
- **Cơ chế truyền `requestId` giữa 2 thiết bị** — không có network trực tiếp giữa 2 phone (không giống flow web "quét QR bằng mobile" của #AUTH-51 gốc). Cần xác nhận: user tự đọc/gõ requestId? Deep link? Push notification kèm requestId?
- Entry point ở màn `login-2fa.tsx` (nút "Xác nhận từ thiết bị khác") — chưa có.

## Files (đã làm)
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/auth/types/auth.types.ts` | modify | `CrossDevice2faRequestPayload { challengeToken }`, `CrossDevice2faRequestResponse { requestId, expiresInSeconds }`, `CrossDevice2faConfirmPayload { requestId, totpCode }` |
| `src/features/auth/services/auth.service.ts` | modify | `requestCrossDevice2fa`, `confirmCrossDevice2fa` |
| `src/features/auth/hooks/useCrossDevice2fa.ts` | create | `useRequestCrossDevice2fa`, `useConfirmCrossDevice2fa` (2 mutation, `onError: handleErrorApi`) |
| `src/lib/endpoints.ts` | modify | `AUTH.TWO_FA_CROSS_DEVICE_REQUEST`, `AUTH.TWO_FA_CROSS_DEVICE_CONFIRM` |

## Kèm theo (KHÔNG thuộc scope issue này — bundle chung commit)
Cùng commit `40f6996` có 1 thay đổi hạ tầng không liên quan tới cross-device 2FA hay login history: đồng bộ rename `ticket comments` → `ticket chats` (khớp BE migration 20260622, đã làm song song bên `frontend`):
- `src/lib/endpoints.ts`: `TICKETS.COMMENT` → `TICKETS.CHATS`
- `src/lib/queryKeys.ts`: `QUERY_KEY.tickets.comments` → `.chats`
- `src/features/tickets/{hooks/useTicketComments.ts, hooks/useTicketCommentsRealtime.ts, services/ticket.service.ts}`, `src/features/staff/{hooks/useStaffAddComment.ts, services/staffTicket.service.ts}`
- SignalR hub path `/hubs/ticket-comments` → `/hubs/ticket-chats`

Đây là sync hợp lệ (khớp với BE + frontend), không phải lỗi — chỉ ghi chú lại vì không nằm trong scope #AUTH-51 lẫn #5, không nên lẫn vào PR của issue này khi ship (nên tách commit/PR riêng, xem review.md).

## Câu hỏi chưa giải đáp (chặn trước khi làm UI)
1. Vì sao đảo ngược quyết định "ngoài scope mobile" ở GH-37? BE có yêu cầu mới, hay Leader quyết định thêm lại?
2. `requestId` (Device A) truyền sang Device B bằng cách nào trên mobile-to-mobile (không có camera/QR giữa 2 phone, không giống web→mobile của #AUTH-51 gốc)?
3. Có cần push notification tới Device B kèm `requestId` khi Device A gọi request không? (Nếu có → cần thêm scope NotificationService, không chỉ AuthService.)

## Acceptance Criteria
- [x] `npx tsc --noEmit` — PASS
- [ ] Câu hỏi ở trên đã được Leader/BE trả lời
- [ ] UI Device A (request + hiển thị requestId/countdown)
- [ ] UI Device B (nhập requestId + TOTP, confirm)
- [ ] Entry point từ `login-2fa.tsx`

## Steps
- [x] Bước 1 — Types: `CrossDevice2faRequestPayload/Response`, `CrossDevice2faConfirmPayload` — 2026-06-29
- [x] Bước 2 — Service: `requestCrossDevice2fa`, `confirmCrossDevice2fa` — 2026-06-29
- [x] Bước 3 — Hook: `useRequestCrossDevice2fa`, `useConfirmCrossDevice2fa` — 2026-06-29
- [x] Bước 4 — `tsc --noEmit` → PASS (verify lại 2026-07-01)
- [ ] Bước 5 — Trả lời 3 câu hỏi ở trên (bắt buộc trước khi làm UI)
- [ ] Bước 6 — UI Device A + Device B + entry point
