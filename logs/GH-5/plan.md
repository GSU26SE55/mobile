# Plan — GH-5: [Mobile] Google OAuth & Login History — Customer/Staff

## Metadata
- **Status:** IMPLEMENTING (retro — plan viết sau khi code đã tồn tại; chỉ phần Login History) | **Role:** Mobile | **Ngày:** 2026-07-01
- **Issue:** #5 — https://github.com/GSU26SE55/mobile/issues/5
- **Branch:** `chat_full` (không theo naming convention `feat/GH-[number]-slug`)
- **Commit:** `40f6996` — feat: add login history and cross-device 2FA functionality (phần login history)

> ⚠️ **Ghi chú quy trình:** Plan này viết SAU khi code đã có (vi phạm rule "không code khi chưa có plan approved"). Ghi lại để đồng bộ log folder với thực tế.

## Mục tiêu
Issue #5 gồm 2 phần độc lập: **Google OAuth** (link/unlink) và **Login History**. Commit `40f6996` **chỉ implement Login History**. Google OAuth vẫn ở trạng thái "chỉ có endpoint const trong `endpoints.ts` (`LINK_GOOGLE`, `UNLINK_GOOGLE`), chưa có service/hook/screen" — **chưa làm**.

## Scope (đã làm — Login History)
- `GET /api/accounts/me/login-history` — phân trang.
- Hiển thị: `action`, `isSuccess`, `ipAddress`, `userAgent`, `reason`, `occurredAt`.

## Scope (CHƯA làm — còn lại của issue #5)
- Google OAuth link (`POST /api/accounts/me/link-google` với `idToken` từ Google Sign-In SDK) — cần xác nhận package (`expo-auth-session` hoặc `@react-native-google-signin/google-signin`), issue gốc ghi "cần thảo luận với BE để confirm endpoint".
- Google OAuth unlink (`POST /api/accounts/me/unlink-google`).
- **Filter params mô tả trong issue nhưng CHƯA implement:** `result` (LoginAttemptResult), `onlyFailed`, `fromUtc`, `toUtc` — `LoginHistoryParams` hiện chỉ có `pageNumber`/`pageSize` (xem review.md).
- Screen/UI hiển thị login history — chưa có (chỉ có hook, chưa có màn hình nào import `useLoginHistory`).

## Files (đã làm)
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/account/types/account.types.ts` | modify | `LoginHistoryParams { pageNumber?, pageSize? }`, `LoginHistoryDto { id, action, isSuccess, ipAddress, userAgent, reason, occurredAt }` |
| `src/features/account/services/account.service.ts` | modify | `getLoginHistory(params)` → `GET ACCOUNT.LOGIN_HISTORY` |
| `src/features/account/hooks/useLoginHistory.ts` | create | `useQuery`, staleTime 60s |
| `src/lib/endpoints.ts` | modify | `ACCOUNT.LOGIN_HISTORY = '/api/accounts/me/login-history'` |
| `src/lib/queryKeys.ts` | modify | `KEY.loginHistory`, `QUERY_KEY.loginHistory.list(params)` |

## Approach
- Layering chuẩn: hook (TanStack Query) → service → axios, giống pattern `useTrustedDevices`/`useExportMyData` ở GH-37.
- Response shape: `CommonResponse<{ items, totalItems, pageNumber, pageSize, hasNextPage }>` — pagination object inline thay vì dùng `PaginationResponse<T>` chung của `src/types/api.types.ts` (xem review.md Warning).

## Acceptance Criteria
- [x] `npx tsc --noEmit` — PASS
- [ ] Filter theo `result`/`onlyFailed`/`fromUtc`/`toUtc` (issue yêu cầu, chưa làm)
- [ ] Screen hiển thị login history (chưa có)
- [ ] Google OAuth link/unlink (chưa làm — phần còn lại của #5)

## Steps
- [x] Bước 1 — Types: `LoginHistoryParams`, `LoginHistoryDto` — 2026-06-29
- [x] Bước 2 — Service: `accountService.getLoginHistory` — 2026-06-29
- [x] Bước 3 — Hook: `useLoginHistory` — 2026-06-29
- [x] Bước 4 — `tsc --noEmit` → PASS (verify lại 2026-07-01)
- [ ] Bước 5 — Filter params đầy đủ theo issue (result/onlyFailed/fromUtc/toUtc)
- [ ] Bước 6 — Screen `app/(customer|staff)/settings/login-history.tsx`
- [ ] Bước 7 — Google OAuth link/unlink (phần còn lại của #5, có thể tách issue riêng nếu cần thảo luận BE)
