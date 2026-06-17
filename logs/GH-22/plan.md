# Plan — GH-22: [Mobile] Staff Ticket Management

## Metadata
- **Status:** REVIEWING | **Role:** FE (Mobile) | **Ngày:** 2026-06-14
- **Issue:** #22 — https://github.com/GSU26SE55/mobile/issues/22
- **Sprint:** Sprint 3 (deadline 2026-06-27)
- **Loại:** Retroactive — code đã tồn tại trong `src/features/staff/**` + `app/(staff)/**`, issue này **chuẩn hóa plan + reconcile contract** với `docs/api-ticket.md`, tham khảo cấu trúc chuẩn từ repo `frontend`.

## Mục tiêu
Chuẩn hóa lại phần Staff Ticket Management (đã code rải rác từ GH-10) cho khớp 100% với `docs/api-ticket.md` và đúng convention codebase (tham chiếu `frontend/src/features/staff`). **Không** đổi cấu trúc folder / naming endpoint hiện có — chỉ bổ sung type còn thiếu, fix contract sai, gỡ mock data, và viết ra plan/cấu trúc đầy đủ làm tài liệu.

> Quyết định approach (đã chốt với user): **Reconcile + fix bug** (giữ structure mobile, surgical) · detail dùng **embedded arrays** trong `TicketDetailDTO` · staff internal comment dùng **payload riêng** `StaffAddCommentPayload`.

---

## ⚠️ Contract Reconciliation bổ sung (2026-06-15) — đối chiếu codebase BE + fix code

> Đối chiếu trực tiếp code BE TicketService phát hiện thêm mismatch ngoài phần GH-22 gốc — **đã fix**:

### M1 — 🔴 `priority`/`impactScope`/`urgencyLevel` NULLABLE
BE (`TicketDTO.cs:15-17`): `?` — null khi chưa triage. **Đã sửa** `ticket.types.ts` → `| null`; staff `[id].tsx` guard `PRIORITY_COLORS`/`PRIORITY_LABELS` khi null, `StaffTicketCard` hiển thị "Chưa phân loại" thay vì fallback nhầm P3.

### M2 — 🔴 `attachments` → `attachmentFileIds: string[]`; bỏ `TicketAttachmentDTO`
BE (`TicketDetailDTO.cs:25`) trả `attachmentFileIds: string[]`. **Đã sửa**: đổi field + **xóa interface `TicketAttachmentDTO`** (không serialize trong response nào). → Điểm "reconcile `TicketAttachmentDTO.uploadedByUserId` → string|null" trong scope GH-22 gốc **không còn áp dụng** (DTO đã bị xóa).

### M3 — 🟡 `ResolvePayload.resolutionSummary` BE **required**
BE (`TicketResolveCommand.cs:27`) validate non-empty → 400. **Đã sửa** `staff.types.ts` → `resolutionSummary: string` (bỏ `?`). `ResolveModal` vốn đã validate ≥10 ký tự nên không gây 400 runtime — chỉ siết type cho khớp.

### M4 — 🟢 `escalationReason` đính chính: nullable, KHÔNG phải `0`
BE (`TicketDetailDTO.cs:20`) khai `?`, trả `null` khi chưa escalate. Edge Case cũ ghi "non-null mặc định `0`" là sai → guard `escalatedAt != null` vẫn đúng.

## Scope

**Trong scope:**
- Type hóa `TicketDetailDTO.maintenanceLogs` từ `unknown[]` → `MaintenanceLogDTO[]` (thêm `MaintenanceLogDTO` theo doc §DTOs).
- Cho phép Staff comment nội bộ (`isInternal=true`) — tách `StaffAddCommentPayload` (customer giữ `isInternal:false` cố định).
- Gỡ `MOCK_DETAIL` trong `app/(staff)/tickets/[id].tsx` — wire dữ liệu thật từ `useStaffTicketDetail` + loading/error/empty state.
- ~~Reconcile nullability lẻ với doc: `TicketAttachmentDTO.uploadedByUserId` → `string | null`.~~ **(2026-06-15: obsolete — `TicketAttachmentDTO` đã bị xóa, BE trả `attachmentFileIds: string[]` — xem M2.)**
- Viết plan + bảng cấu trúc đầy đủ (deliverable tài liệu).

**Ngoài scope (giữ nguyên / để issue sau):**
- Đổi naming/structure để khớp 1:1 frontend (`MY_LIST`→`ME`, tách `getActivities`/`getComments`, param camelCase mapped, gộp service) — **không làm** (giữ structure mobile).
- `start` gửi body `logType/latitude/longitude` (GH-10 S4 🟢 nice-to-have, GPS out of scope) — giữ `start(id)` không body.
- `GET /api/staff/tickets/maintenance-logs/me` (lịch sử gom nhóm — GH-10 S5).
- Maintenance/comment photo upload (phụ thuộc FileStorage Infra — issue riêng).
- Admin/Manager actions (triage/assign/approve/reject/escalate/declare-incident).
- Bổ sung `skillTier`/`currentTicketCount` thật cho `StaffProfileDTO` — không có endpoint trả về, giữ placeholder hiện tại.

## Endpoints (đã có sẵn — chỉ reconcile, không đổi)
| Method | Path | Dùng cho | Ghi chú |
|--------|------|----------|---------|
| GET | `/api/staff/tickets/me` | List ticket được giao | `Status`, `PageNumber`, `PageSize`; BE auto-lọc theo JWT |
| GET | `/api/tickets/{id}` | Detail (embed activities/comments/maintenanceLogs) | nguồn dữ liệu chính cho detail screen |
| POST | `/api/staff/tickets/{id}/start` | Bắt đầu xử lý | auto tạo maintenance log |
| POST | `/api/staff/tickets/{id}/hold` | Tạm dừng | `{ reason: PauseReasonEnum, note? }` |
| POST | `/api/staff/tickets/{id}/resume` | Tiếp tục | → `InProgress` |
| POST | `/api/staff/tickets/{id}/resolve` | Báo xong | `{ resolutionSummary? }` |
| POST | `/api/staff/tickets/{id}/escalate-request` | Yêu cầu chuyển cấp | `{ reason: EscalationReasonEnum, note? }` |
| POST | `/api/tickets/{ticketId}/comments` | Thêm comment | Staff được `isInternal=true` |
| POST | `/api/tickets/{ticketId}/maintenance-logs` | Ghi log bảo trì | `summary` bắt buộc; 1 log mở → vi phạm 409 |
| GET | `/api/auth/me` | Staff profile tab | map → `StaffProfileDTO` |

## Cấu trúc hiện tại (tài liệu hóa — đối chiếu convention `frontend/src/features/staff`)
```
src/features/staff/
├── enums/      staff.enum.ts                  (StaffSkillTierEnum)
├── types/      staff.types.ts                 (payloads + StaffProfileDTO + StaffTicketListParams)
├── services/   staff.service.ts               (getProfile → /api/auth/me)
│               staffTicket.service.ts         (9 method: list/detail/start/hold/resume/resolve/escalate/comment/log)
├── hooks/      useStaffTickets, useStaffTicketDetail, useStaffProfile,
│               useStartTicket, useHoldTicket, useResumeTicket, useResolveTicket,
│               useEscalateTicket, useStaffAddComment, useAddMaintenanceLog
└── components/ StaffTicketCard, TicketActionBar, HoldModal, ResolveModal,
                EscalateModal, MaintenanceLogForm
app/(staff)/
├── (tabs)/     _layout, dashboard, notifications, profile
├── _layout, index
└── tickets/[id].tsx                           (detail screen)
```
> DTO/enum dùng chung ticket nằm ở `src/features/tickets/types/ticket.types.ts` + `src/shared/enums/ticket.enum.ts` — staff re-dùng, không định nghĩa lại (đúng convention shared của frontend).

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/tickets/types/ticket.types.ts` | modify | Thêm `MaintenanceLogDTO`; `TicketDetailDTO.maintenanceLogs: MaintenanceLogDTO[] \| null`; **[2026-06-15]** `priority/impactScope/urgencyLevel → \| null`; `attachments → attachmentFileIds: string[] \| null` + xóa `TicketAttachmentDTO` |
| `src/features/staff/types/staff.types.ts` | modify | Thêm `StaffAddCommentPayload { body; isInternal?; attachments? }`; **[2026-06-15]** `ResolvePayload.resolutionSummary` → required (bỏ `?`) — M3 |
| `src/features/staff/services/staffTicket.service.ts` | modify | `addComment` param → `StaffAddCommentPayload` |
| `src/features/staff/hooks/useStaffAddComment.ts` | modify | dùng `StaffAddCommentPayload` thay `AddCommentPayload` |
| `app/(staff)/tickets/[id].tsx` | modify | Gỡ `MOCK_DETAIL` + fallback; loading/error/empty state thật; render `maintenanceLogs` theo `MaintenanceLogDTO`; cho phép toggle internal comment |
| `src/features/staff/components/MaintenanceLogForm.tsx` | verify | Đảm bảo payload khớp `MaintenanceLogPayload` (đã reconcile GH-10 S2) — chỉ sửa nếu lệch |
| `logs/GH-22/plan.md` | create | Tài liệu plan + cấu trúc (deliverable) |

## Types mới / sửa
```ts
// ticket.types.ts — thêm (theo doc §MaintenanceLogDTO)
interface MaintenanceLogDTO {
  id: string; ticketId: string; staffId: string;
  logType: MaintenanceLogTypeEnum;
  summary: string | null; diagnosisDetails: string | null; actionsTaken: string | null;
  durationMinutes: number; resolutionNote: string | null;
  startedAt: string; completedAt: string | null;
  attachmentFileIds: string[] | null;
  beforePhotosFileIds: string[] | null; afterPhotosFileIds: string[] | null;
  relatedKbArticleIds: string[] | null; createdAt: string;
}
// TicketDetailDTO.maintenanceLogs: MaintenanceLogDTO[] | null   // was unknown[]

// staff.types.ts — thêm
interface StaffAddCommentPayload {
  body: string;
  isInternal?: boolean;          // staff được phép true; customer payload giữ false cố định
  attachments?: CommentAttachmentPayload[];
}
```

## Approach
- **Detail screen**: `useStaffTicketDetail(id)` → `TicketDetailDTO` đã embed `activities`/`comments`/`maintenanceLogs` (đúng doc `GET /api/tickets/{id}`). 3 tab Trao đổi / Lịch sử / Nhật ký đọc trực tiếp từ object detail — không thêm method service.
- **Mock removal**: thay `apiDetail ?? MOCK_DETAIL` bằng xử lý `isLoading` (spinner) / `isError` / không có data (empty state). Xóa hằng `MOCK_DETAIL`.
- **Internal comment**: form comment của staff thêm toggle "nội bộ" → gửi `StaffAddCommentPayload { isInternal }`.
- **Mutations**: giữ nguyên 7 hook action (start/hold/resume/resolve/escalate/comment/log) — chỉ đổi type của comment hook. onSuccess invalidate `KEY.staffTickets` (đã có).
- **Surgical**: không động endpoints.ts, không đổi naming, không refactor customer ticket code.

## Edge Cases
- Detail load lỗi / không có quyền (403/404): hiện empty/error state, không crash (đang bị che bởi mock fallback).
- `maintenanceLogs`/`comments`/`activities` = `null`: render empty (`?? []`).
- POST maintenance-log khi đã có 1 log mở → BE trả `409`: hiện toast lỗi qua `handleErrorApi`.
- Action sai trạng thái ticket → BE `403`: hiện message từ response, `TicketActionBar` chỉ show action hợp lệ theo `status`.
- `escalationReason` **nullable** — BE trả `null` khi chưa escalate (KHÔNG phải `0`) → chỉ tin khi `escalatedAt != null`. [M4]
- `priority`/`impactScope`/`urgencyLevel` **null khi chưa triage** → guard badge/màu, hiển thị "Chưa phân loại". [M1]
- `resolve` body `resolutionSummary` **bắt buộc** (BE 400 nếu rỗng) — `ResolveModal` validate ≥10 ký tự. [M3]

## Acceptance Criteria
- [ ] `MaintenanceLogDTO` tồn tại; `TicketDetailDTO.maintenanceLogs` không còn `unknown[]`.
- [ ] `app/(staff)/tickets/[id].tsx` không còn `MOCK_DETAIL`; có loading/error/empty state thật.
- [ ] Staff gửi được comment nội bộ (`isInternal=true`) qua `StaffAddCommentPayload`; customer payload vẫn cố định `isInternal:false`.
- [ ] Tab Nhật ký render đúng field của `MaintenanceLogDTO`.
- [ ] Mọi payload/endpoint staff khớp `docs/api-ticket.md` (hold/resolve/escalate/log/comment).
- [ ] `npx tsc --noEmit` PASS (0 lỗi).

## Steps
- [x] Bước 1 — Types: thêm `MaintenanceLogDTO` + sửa `TicketDetailDTO.maintenanceLogs` + `TicketAttachmentDTO.uploadedByUserId` trong `ticket.types.ts`. — 2026-06-14
- [x] Bước 2 — Types: thêm `StaffAddCommentPayload` trong `staff.types.ts`. — 2026-06-14
- [x] Bước 3 — Service: đổi param `addComment` sang `StaffAddCommentPayload`. — 2026-06-14
- [x] Bước 4 — Hook: cập nhật `useStaffAddComment` dùng `StaffAddCommentPayload`. — 2026-06-14
- [x] Bước 5 — Screen: gỡ `MOCK_DETAIL` (+ `NOW`), wire `useStaffTicketDetail` thật + not-found state, sửa render log đúng field `MaintenanceLogDTO` (summary/actionsTaken/diagnosisDetails/resolutionNote/durationMinutes), thêm toggle internal comment. — 2026-06-14
- [x] Bước 6 — `MaintenanceLogForm.onSubmit` type hóa `MaintenanceLogPayload`. — 2026-06-14
- [x] Bước 7 — `npx tsc --noEmit` → **No errors**; `npx expo lint` → 0 issue mới trên file đã sửa. — 2026-06-14

## Ghi chú khi implement
- `[id].tsx` cũ render log bằng field sai (`log.description`/`log.actionTaken`) ẩn dưới `any` → đã sửa đúng `MaintenanceLogDTO`.
- Gỡ `apiDetail ?? MOCK_DETAIL`; thêm not-found/error state (trước đây mock fallback che mất 403/404).
- Comment composer thêm nút toggle 🔒 nội bộ → gửi `isInternal` qua `StaffAddCommentPayload`.

## Câu hỏi đã giải đáp
1. **Mức độ refactor** → Reconcile + fix bug (giữ structure mobile, surgical) — không align 1:1 naming frontend.
2. **Nguồn dữ liệu detail** → Dùng embedded arrays trong `TicketDetailDTO`, không thêm `getActivities`/`getComments` riêng.
3. **Staff internal comment** → Tách `StaffAddCommentPayload` (isInternal?: boolean); customer giữ `isInternal:false`.
4. **Phát hiện khi đọc code**: `StaffProfileDTO` KHÔNG dead (được `useStaffProfile` map từ `AccountDto`) — chỉ có `skillTier`/`currentTicketCount` là placeholder do thiếu endpoint → giữ nguyên, ngoài scope.
