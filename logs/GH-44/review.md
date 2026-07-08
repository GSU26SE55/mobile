# BÁO CÁO CODE REVIEW — feat/GH-44-ticket-kb-endpoints-realtime — 2026-06-22

## TÓM TẮT
GH-44 bổ sung 7 REST endpoint + SignalR realtime cho ticket detail (Customer + Staff) và fix các workaround cũ (comments/activities đọc embed, KB suggest client-side). Diff thực tế = working tree (chưa commit): **20 file sửa + 11 file mới, +440/−187**. Kiến trúc theo đúng pattern repo (endpoints → queryKeys → types → service → hook → component); `tsc` sạch, `expo lint` 0 error. Không có lỗi Critical. Một vài Warning non-blocking quanh realtime + pagination.

## PHÂN TÍCH

### ✅ Pass
- **Layering chuẩn:** không gọi API trong component — qua `services/` → hook TanStack Query (`useTicketComments`, `useKbSuggest`, …).
- **Không tạo Axios instance mới:** mọi service dùng `axiosInstance` từ `lib/axios.ts`.
- **Endpoints tập trung:** thêm `TICKETS.ACTIVITIES`, `STAFF_TICKETS.MY_MAINTENANCE_LOGS/MAINTENANCE_LOG_ITEM`, `KNOWLEDGE_BASE.SUGGEST`, `KB_REFERENCES.ITEM` vào `endpoints.ts` — không hardcode URL.
- **queryKey factory:** dùng `QUERY_KEY.tickets.comments/activities`, `kb.suggest`, `staffTickets.myLogs` — không inline array.
- **Enum pattern:** `KbReferenceTypeEnum` dạng `as const` + label map, gửi BE dạng chuỗi (đúng contract).
- **Realtime cache strategy:** `CommentAdded` (full DTO) → `setQueryData` prepend + **dedup theo id**; POST KHÔNG invalidate khi `isConnected`, fallback refetch khi `!isConnected` → tránh double refetch/nhấp nháy. Khớp 100% backend đã verify (sender nhận lại event, `Clients.Group`).
- **Lifecycle SignalR:** `withAutomaticReconnect`, `JoinTicket` sau start, `LeaveTicket`+`stop` khi cleanup, clear typing timers; lỗi connect swallow → fallback REST đầy đủ.
- **Quyền hạn UI khớp BE:** nút sửa log chỉ hiện trên log của chính Staff + ticket chưa đóng; gán/gỡ KB chỉ Staff được phân công + ticket mở (BE vẫn chặn 403 — defense-in-depth).
- **Error handling:** mutation dùng `handleErrorApi`; action có xác nhận (Alert) cho xóa KB ref.
- **Fix đúng hướng:** xóa `useRelatedKb` (client-side) → `useKbSuggest` server-driven; bỏ chat `scrollToEnd` cho phù hợp DESC.

### 🟡 Warning
- **[ĐÃ FIX] `useTicketCommentsRealtime.ts` — typing gửi mỗi keystroke:** thêm throttle `TYPING_THROTTLE=1500ms` (timestamp guard) trong `notifyTyping` → tối đa 1 invoke/1.5s.
- **[ĐÃ FIX] Pagination offset + realtime insert → trùng comment khi tải trang cũ:** thêm dedup theo `id` khi flatten các page ở cả 2 màn (`seenCommentIds` Set) → không còn trùng key React/lặp UI.
- **[Còn lại — non-blocking] `MaintenanceLogForm` reset field ngay khi submit (trước khi biết success):** ở chế độ sửa (PATCH), nếu API lỗi thì input đã bị clear. Pattern sẵn có từ chế độ thêm; để lại, không sửa theo nguyên tắc surgical (ngoài scope GH-44 gốc).
- **[Còn lại — chấp nhận] `prependComment` no-op khi page đầu null:** nếu `pages[0]` là `null`, comment realtime không chèn tới khi refetch. Hiếm (query lỗi/empty lúc connected).

### RỦI RO & LƯU Ý
- **Process — local `dev` đang sau branch base:** `HEAD=7fcd53b` đứng trước `dev=db46284` 1 commit (GH-43 notification-preferences/settings/docs). Khi `/kltn-ship`, diff PR `dev...HEAD` sẽ **kèm cả công việc GH-43 chưa merge vào dev**. → Trước khi ship, `git fetch` + rebase/cập nhật `dev` để PR chỉ chứa GH-44, tránh review nhầm scope.
- **Package mới `@microsoft/signalr@10.0.0`:** đã ghi vào `mobile.md` + Leader chốt — không vi phạm rule "hỏi Leader".
- **Deviation so với plan (đã ghi trong plan):** `StaffMaintenanceLogGroupDTO`/`UpdateMaintenanceLogPayload` đặt ở `staff.types.ts`; thêm màn `maintenance-history` (#3) + `KbSuggestCard`. Hợp lý, feature-consistent.
- **Warning lint pre-existing (49):** không phát sinh mới từ GH-44; không sửa theo nguyên tắc surgical.

## KẾT LUẬN
**PASS** — Độ tự tin: **Cao**

Không có lỗi Critical. Đã fix 2 Warning đáng giá (throttle typing + dedup flatten) — `tsc` sạch, `lint` 0 error sau fix. 2 mục còn lại non-blocking, để lại theo nguyên tắc surgical. Khuyến nghị xử lý lưu ý process (cập nhật local `dev` trước khi ship) để PR đúng scope GH-44.
