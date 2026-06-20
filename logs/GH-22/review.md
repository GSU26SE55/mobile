## BÁO CÁO CODE REVIEW — feat/GH-24-staff-battery-view (⚠️ sai branch, xem Rủi ro) — 2026-06-14
### Scope: FE (Mobile)
### Effort: Standard
### Ticket: GH-22 — [Mobile] Staff Ticket Management

### TÓM TẮT
Code GH-22 đúng contract `docs/api-ticket.md`, reconcile sạch, `tsc --noEmit` PASS, `expo lint` 0 issue mới trên 6 file. Bản thân code đạt chất lượng ship. **Tuy nhiên có 1 blocker quy trình nghiêm trọng về branch/working-tree** (không phải lỗi code) phải xử lý trước khi `/kltn-test`/`/kltn-ship`.

### PHÂN TÍCH

🔴 Critical (PROCESS — không phải code):
- **Sai branch + working-tree trộn lẫn.** HEAD đang ở `feat/GH-24-staff-battery-view`, không phải `feat/GH-22-staff-ticket-management` (branch GH-22 tồn tại nhưng trỏ `801f440`, chưa có commit nào của GH-22). Toàn bộ thay đổi GH-22 đang **uncommitted**, lẫn với ~35 file modified + nhiều untracked của các ticket khác (GH-3/4/10, 2FA, batteries GH-24/25, docs). → `/kltn-ship` sẽ commit nhầm cả đống vào branch sai. **Phải tách GH-22 ra branch riêng trước khi ship.**

✅ Fixed (Warning #1 — đã xử lý trong review này):
- **Mutation `onError → handleErrorApi`.** Đã thêm `onError: (error) => handleErrorApi({ error })` vào cả 7 staff mutation hook (start/hold/resume/resolve/escalate/comment/log). Lỗi 409 (1 log mở) / 403 (sai trạng thái) giờ hiện `Alert` qua `handleErrorApi`, đúng plan §Edge Cases & rule fe.md. `tsc`/lint sạch sau fix.

🟡 Warning (còn lại — user chọn để sau):
- **`[id].tsx` internalToggle thiếu nhãn/gợi ý.** Nút khóa 🔒 bật/tắt comment nội bộ nhưng không có label/hint; user khó hiểu lock = "nội bộ, ẩn với Customer". Gợi ý: thêm nhãn nhỏ hoặc đổi placeholder khi bật internal. (Không chặn — để ticket sau.)
- **staff → tickets cross-feature import.** `staff/types/staff.types.ts` import `CommentAttachmentPayload` từ `features/tickets/...` (và service import TicketDTO/TicketDetailDTO/TicketActionResponse). Đây là pattern đã tồn tại sẵn trong codebase mobile (không có eslint no-restricted-imports như web) — chấp nhận được, ghi nhận để thống nhất về sau (cân nhắc đưa ticket DTO chung lên shared/).

✅ Pass:
- API qua `services/` → TanStack Query hook, không fetch trực tiếp trong component.
- Dùng `axiosInstance` chung (`src/lib/axios.ts`), không tạo instance mới.
- Endpoint qua `ENDPOINTS`, không hardcode URL/token.
- `queryKey` dùng `QUERY_KEY.staffTickets.detail(id)`; invalidate `KEY.staffTickets` (root) — prefix-match nên detail tự refetch sau action/comment. Đúng.
- Loading + error/not-found state đã xử lý (gỡ `MOCK_DETAIL`, thêm not-found view) — đây là fix chính của GH-22.
- `MaintenanceLogDTO` đầy đủ theo doc; `maintenanceLogs` hết `unknown[]`; render đúng field (`summary/actionsTaken/diagnosisDetails/resolutionNote/durationMinutes`).
- `StaffAddCommentPayload` cho phép `isInternal=true`; customer payload vẫn cố định `false`.
- `MaintenanceLogForm.onSubmit` type hóa `MaintenanceLogPayload`; field gửi khớp (`summary/actionsTaken/partsUsed/durationMinutes`).
- Zustand chỉ dùng cho session (`accountId`), không dùng làm server cache.
- Không còn `console.log`, không còn mock data sót.
- Expo Router navigation đúng (`router.back()`); auth do group `(staff)` layout xử lý (pattern mobile, không cần per-screen wrap).

### RỦI RO & LƯU Ý
- **Quyết định branch (user chọn):** giữ nguyên branch `feat/GH-24-staff-battery-view`. Khi `/kltn-ship` **chỉ `git add` đúng 12 file GH-22** (KHÔNG `git add -A`/`add .`) để tránh kéo theo WIP của ticket khác. Lưu ý: commit GH-22 sẽ nằm trên branch tên GH-24 — chấp nhận theo yêu cầu user.
- **12 file GH-22 cần stage khi ship:**
  - `src/features/tickets/types/ticket.types.ts`
  - `src/features/staff/types/staff.types.ts`
  - `src/features/staff/services/staffTicket.service.ts`
  - `src/features/staff/components/MaintenanceLogForm.tsx`
  - `app/(staff)/tickets/[id].tsx`
  - `src/features/staff/hooks/`: `useStaffAddComment.ts`, `useStartTicket.ts`, `useHoldTicket.ts`, `useResumeTicket.ts`, `useResolveTicket.ts`, `useEscalateTicket.ts`, `useAddMaintenanceLog.ts`
  - (+ `logs/GH-22/` tài liệu)
- Diff vs HEAD còn chứa các fix GH-10 S1–S3 (HoldReasonEnum→PauseReasonEnum, ResolvePayload optional, rename field log) — vốn đã uncommitted từ trước; thuộc cùng vùng staff ticket nên hợp lý đi kèm GH-22.

### KẾT LUẬN
**Code: PASS** — Độ tự tin: **Cao** (tsc/lint sạch, contract khớp doc, Warning #1 đã fix).
**Ship-readiness:** OK với điều kiện `/kltn-ship` stage đúng 12 file GH-22 (không add toàn bộ working tree). Warning #2 (toggle label) không chặn, để sau.
