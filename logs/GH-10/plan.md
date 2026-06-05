# Plan — GH-10: [Mobile] Customer Ticket Management

## Metadata
- **Status:** REVIEWING | **Role:** Mobile | **Ngày:** 2026-06-05
- **Issue:** #10 — https://github.com/GSU26SE55/mobile/issues/10
- **Sprint:** Sprint 2 (due: 2026-06-13)

## Mục tiêu
Implement toàn bộ luồng quản lý ticket cho Customer trên Mobile app:
danh sách ticket, tạo mới, xem chi tiết + activity timeline, và các action (comment, reopen, rate).

## Scope
**Trong scope:**
- Ticket list screen: GET /api/customer/tickets/me (filter status, pagination)
- Create ticket screen: POST /api/customer/tickets (title, description, category, batteryAssetId)
- Ticket detail screen: GET /api/tickets/{id} (activities + comments embedded trong response)
- Add comment: POST /api/tickets/{ticketId}/comments (body, isInternal=false)
- Reopen ticket: POST /api/customer/tickets/{id}/reopen (khi status=ClosedPendingRate)
- Rate ticket: POST /api/customer/tickets/{id}/rate (rating 1-5, ratingComment)
- Thêm tab "Tickets" vào tab navigator của Customer

**Ngoài scope:**
- File attachment upload (cần FileStorageService riêng)
- Internal comments (isInternal=true — chỉ Staff/Manager xem được)
- Maintenance logs (Staff only)
- Staff/Manager ticket actions
- Push notification khi ticket thay đổi trạng thái

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/endpoints.ts` | modify | Thêm customer ticket endpoints, activities, comment, reopen, rate |
| `src/lib/queryKeys.ts` | — | Không cần sửa — `tickets.list/detail` đã đủ, activities embedded trong detail |
| `app/(customer)/(tabs)/_layout.tsx` | modify | Thêm Tickets tab |
| `src/features/tickets/types/ticket.types.ts` | create | Enums + DTOs |
| `src/features/tickets/services/ticket.service.ts` | create | Tất cả API calls |
| `src/features/tickets/hooks/useTickets.ts` | create | GET list (useQuery) |
| `src/features/tickets/hooks/useTicketDetail.ts` | create | GET detail (useQuery) |
| `src/features/tickets/hooks/useCreateTicket.ts` | create | POST create (useMutation) |
| `src/features/tickets/hooks/useAddComment.ts` | create | POST comment (useMutation) |
| `src/features/tickets/hooks/useReopenTicket.ts` | create | POST reopen (useMutation) |
| `src/features/tickets/hooks/useRateTicket.ts` | create | POST rate (useMutation) |
| `src/features/tickets/schemas/createTicket.schema.ts` | create | Zod: manual safeParse |
| `src/features/tickets/schemas/rateTicket.schema.ts` | create | Zod: manual safeParse |
| `src/features/tickets/schemas/comment.schema.ts` | create | Zod: manual safeParse |
| `src/features/tickets/components/TicketCard.tsx` | create | Card item cho danh sách |
| `src/features/tickets/components/TicketStatusBadge.tsx` | create | Badge màu theo TicketStatusEnum |
| `src/features/tickets/components/SlaCountdown.tsx` | create | Hiển thị SLA remaining % + dueAt |
| `src/features/tickets/components/ActivityTimeline.tsx` | create | Timeline lịch sử hành động |
| `src/features/tickets/components/CreateTicketForm.tsx` | create | Form tạo ticket mới |
| `src/features/tickets/components/RateModal.tsx` | create | Modal đánh giá 1-5 sao |
| `src/features/tickets/components/ReopenModal.tsx` | create | Modal confirm reopen + lý do |
| `app/(customer)/tickets/index.tsx` | create | Ticket list screen |
| `app/(customer)/tickets/[id].tsx` | create | Ticket detail screen |
| `app/(customer)/tickets/create.tsx` | create | Create ticket screen |

---

## Types

```ts
// --- Enums ---
export type TicketStatusEnum =
  | 'New' | 'Open' | 'Approved' | 'Assigned' | 'InProgress'
  | 'WaitingCustomer' | 'WaitingParts' | 'WaitingOnsiteSchedule'
  | 'Resolved' | 'Escalated' | 'ClosedPendingRate' | 'Closed'
  | 'ClosedRejected' | 'Incident';

export type TicketPriorityEnum = 'P1Critical' | 'P2High' | 'P3Normal';

export type TicketCategoryEnum =
  | 'Charging' | 'Overheat' | 'NoPower' | 'Performance' | 'Repair' | 'Other';

export type TicketOriginEnum = 'ManualByCustomer' | 'AutoFromAlert' | 'CreatedByStaff';

export type ImpactScopeEnum = 'SingleAsset' | 'Site' | 'MultiSite';

export type UrgencyLevelEnum = 'Low' | 'Medium' | 'High';

export type EscalationReasonEnum =
  | 'SkillGap' | 'PartsRequired' | 'SafetyConcern' | 'SlaBreach' | 'CustomerComplaint';

export type SlaTimerStatusEnum = 'Running' | 'Paused' | 'Met' | 'Breached';

export type ActorRoleEnum = 'Admin' | 'Manager' | 'Staff' | 'Customer' | 'System';

export type ActivityActionEnum =
  | 'Created' | 'StatusChanged' | 'PriorityAssigned' | 'StaffAssigned'
  | 'StaffReassigned' | 'Commented' | 'MaintenanceLogged' | 'AttachmentAdded'
  | 'SlaPaused' | 'SlaResumed' | 'SlaWarning' | 'SlaBreached'
  | 'EscalationRequested' | 'Escalated' | 'IncidentDeclared' | 'Resolved'
  | 'Approved' | 'Rejected' | 'Rated' | 'Reopened' | 'AutoClosed'
  | 'ResolvedByEscalatedStaff' | 'TriageApproved';

// --- DTOs ---
export interface SlaTimerDTO {
  id: string;
  priority: TicketPriorityEnum;
  startedAt: string;
  dueAt: string;
  originalDueAt: string;
  totalPausedMinutes: number;
  warningSentAt: string | null;
  breachAt: string | null;
  status: SlaTimerStatusEnum;
  remainingPercent: number;
}

export interface TicketActivityDTO {
  id: string;
  ticketId: string;
  actorUserId: string | null;
  actorRole: ActorRoleEnum;
  actorDisplayName: string | null;
  action: ActivityActionEnum;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  createdAt: string;
}

export interface TicketCommentDTO {
  id: string;
  ticketId: string;
  authorUserId: string | null;
  authorRole: ActorRoleEnum;
  authorDisplayName: string | null;
  body: string;
  isInternal: boolean;
  attachmentFileIds: string[] | null;
  createdAt: string;
}

export interface TicketDTO {
  id: string;
  code: string;
  batteryAssetId: string | null;
  customerId: string;
  assignedStaffId: string | null;
  title: string;
  category: TicketCategoryEnum;
  priority: TicketPriorityEnum;
  impactScope: ImpactScopeEnum;
  urgencyLevel: UrgencyLevelEnum;
  status: TicketStatusEnum;
  origin: TicketOriginEnum;
  reopenCount: number;
  isIncident: boolean;
  createdAt: string;
  updatedAt: string | null;
  slaTimer: SlaTimerDTO;
}

export interface TicketDetailDTO extends TicketDTO {
  description: string | null;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  resolvedByStaffId: string | null;
  approvedAt: string | null;
  approvedByManagerId: string | null;
  rejectionReason: string | null;
  closedAt: string | null;
  rating: number | null;
  ratingComment: string | null;
  ratedAt: string | null;
  escalatedAt: string | null;
  escalationReason: EscalationReasonEnum | null;  // treat as optional per API doc note
  originAlertId: string | null;
  activities: TicketActivityDTO[] | null;
  comments: TicketCommentDTO[] | null;
  maintenanceLogs: unknown[] | null;  // ngoài scope — unknown[] để tránh lỗi khi BE trả []
  attachments: unknown[] | null;      // ngoài scope — unknown[] để tránh lỗi khi BE trả []
}

// --- TicketActionResponse (dùng trong mọi mutation hook) ---
export interface TicketActionDto {
  id: string | null;
  code: string | null;
  status: TicketStatusEnum;
}

export interface TicketActionResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  data: TicketActionDto | null;
  listErrors: Array<{ field: string | null; detail: string | null }> | null;
}

// --- Payloads ---
export interface CreateTicketPayload {
  title: string;
  description: string;
  category: TicketCategoryEnum;
  batteryAssetId?: string;
}

export interface AddCommentPayload {
  body: string;
  isInternal: false;   // hardcoded false cho Customer
}

export interface RatePayload {
  rating: number;
  ratingComment?: string;
}

export interface ReopenPayload {
  reopenReason?: string;
}

// --- Query params ---
export interface TicketListParams {
  Status?: TicketStatusEnum;
  PageNumber?: number;
  PageSize?: number;
}
```

---

## Schema (Zod)

> **Lưu ý:** Mobile dùng `schema.safeParse(data)` thủ công — **không dùng React Hook Form**. Lỗi parse được map vào local state để hiển thị inline.

```ts
// createTicket.schema.ts
export const createTicketSchema = z.object({
  title:         z.string().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự'),
  description:   z.string().min(1, 'Không được để trống').max(2000, 'Tối đa 2000 ký tự'),
  category:      z.enum(['Charging', 'Overheat', 'NoPower', 'Performance', 'Repair', 'Other']),
  batteryAssetId: z.string().uuid().optional(),
});

// rateTicket.schema.ts
export const rateTicketSchema = z.object({
  rating:        z.number().int().min(1, 'Tối thiểu 1 sao').max(5, 'Tối đa 5 sao'),
  ratingComment: z.string().max(500).optional(),  // FE-only constraint — API doc không có max length
});

// comment.schema.ts
export const commentSchema = z.object({
  body: z.string().min(1, 'Không được để trống').max(1000, 'Tối đa 1000 ký tự'),  // FE-only constraint — API doc không có max length
});
```

---

## Endpoints

| Method | Path | Body / Query | Response |
|--------|------|-------------|----------|
| GET | `/api/customer/tickets/me` | `?Status&PageNumber&PageSize` | `CommonResponse<PaginationResponse<TicketDTO>>` |
| POST | `/api/customer/tickets` | `CreateTicketPayload` | `TicketActionResponse` |
| GET | `/api/tickets/{id}` | — | `CommonResponse<TicketDetailDTO>` |
| POST | `/api/tickets/{id}/comments` | `AddCommentPayload` | `TicketActionResponse` |
| POST | `/api/customer/tickets/{id}/reopen` | `ReopenPayload` | `TicketActionResponse` |
| POST | `/api/customer/tickets/{id}/rate` | `RatePayload` | `TicketActionResponse` |

**ENDPOINTS update cần thêm:**
```ts
TICKETS: {
  CUSTOMER_LIST:   '/api/customer/tickets/me',
  CUSTOMER_CREATE: '/api/customer/tickets',
  DETAIL:          (id: string) => `/api/tickets/${id}`,       // đã có, giữ nguyên
  COMMENT:         (id: string) => `/api/tickets/${id}/comments`,
  REOPEN:          (id: string) => `/api/customer/tickets/${id}/reopen`,
  RATE:            (id: string) => `/api/customer/tickets/${id}/rate`,
}
```

---

## Workflow

**Create ticket flow:**
```
Submit form → createTicketSchema.safeParse(formData)
  → invalid: set errors vào local state → hiển thị inline dưới input → abort
  → valid:   useCreateTicket.mutateAsync(payload)
              → OK:   invalidate KEY.tickets → router.back() (về ticket list)
              → FAIL: toast.error(message)
```

**Add comment flow:**
```
Submit comment → commentSchema.safeParse({ body })
  → invalid: set error state → hiển thị inline
  → valid:   useAddComment.mutateAsync({ ticketId, body, isInternal: false })
              → OK:   invalidate QUERY_KEY.tickets.detail(id) → input cleared
              → FAIL: toast.error(message)
```

**Rate ticket flow:**
```
Tap "Đánh giá" (chỉ hiện khi status === 'ClosedPendingRate') → mở RateModal
  → user chọn sao + nhập comment → rateTicketSchema.safeParse
  → invalid: hiển thị lỗi inline trong modal → abort
  → valid: useRateTicket.mutateAsync
           → OK:   invalidate detail + list → đóng modal
           → FAIL: toast.error
```

**Reopen ticket flow:**
```
Tap "Yêu cầu xử lý lại" (chỉ hiện khi status === 'ClosedPendingRate') → mở ReopenModal
  → user nhập lý do (optional) → useReopenTicket.mutateAsync
  → OK: invalidate detail + list → đóng modal
  → FAIL (403 quá 7 ngày): toast.error("Đã quá 7 ngày để mở lại ticket")
```

---

## Approach

- **Data flow:** Screen → useMutation/useQuery hook → ticketService → axiosInstance → BE
- **List:** FlatList với pagination (PageNumber, PageSize=10), filter tab theo status, pull-to-refresh
- **Detail:** ScrollView hiển thị ticket info + SlaCountdown + ActivityTimeline + comments list (chỉ filter `isInternal=false`); floating action buttons tuỳ theo status
- **Mutations:** Sau khi thành công → invalidate `KEY.tickets` để list + detail tự refetch

## Edge Cases
- **Comment:** `isInternal` hardcode `false`; filter ẩn comment có `isInternal=true` khi render
- **Rate/Reopen:** Chỉ render nút khi `status === 'ClosedPendingRate'`
- **Activities:** Embedded trong `TicketDetailDTO.activities[]` — không cần gọi separate endpoint
- **403 reopen:** Hiển thị toast "Đã quá 7 ngày để mở lại ticket" thay vì generic error
- **Empty list:** Hiển thị EmptyState component

## Success Criteria

| Tiêu chí | Cách verify |
|----------|------------|
| Danh sách ticket hiển thị đúng, phân trang hoạt động | Gọi GET /api/customer/tickets/me, scroll xuống |
| Create ticket: form validate inline + submit thành công | Điền form, submit, ticket mới xuất hiện trong list |
| Ticket detail hiển thị đủ info + activities (activities embedded) | Mở ticket bất kỳ |
| Comment được thêm, không hiển thị internal comments | Gửi comment, kiểm tra filter isInternal |
| Rate + Reopen chỉ xuất hiện khi status=ClosedPendingRate | Kiểm tra ticket ở đúng trạng thái |
| `npx tsc --noEmit` + `npx eslint . --max-warnings=0` PASS | Chạy trong terminal |

## Steps
- [x] Bước 1: Update `src/lib/endpoints.ts` (thêm CUSTOMER_LIST, CUSTOMER_CREATE, COMMENT, REOPEN, RATE) — 2026-06-05
- [ ] Bước 2: ~~`src/lib/queryKeys.ts`~~ — bỏ qua, không cần sửa
- [x] Bước 3: Tạo `src/features/tickets/types/ticket.types.ts` (enums + DTOs + payloads) — 2026-06-05
- [x] Bước 4: Tạo schemas (createTicket, rateTicket, comment — manual safeParse, không dùng useForm) — 2026-06-05
- [x] Bước 5: Tạo `src/features/tickets/services/ticket.service.ts` — 2026-06-05
- [x] Bước 6: Tạo hooks (useTickets, useTicketDetail, useCreateTicket, useAddComment, useReopenTicket, useRateTicket) — 2026-06-05
- [x] Bước 7: Tạo components (TicketCard, TicketStatusBadge, SlaCountdown, ActivityTimeline, CreateTicketForm, RateModal, ReopenModal) — 2026-06-05
- [x] Bước 8: Tạo screens (`app/(customer)/(tabs)/tickets.tsx`, `app/(customer)/tickets/[id].tsx`, `app/(customer)/tickets/create.tsx`) — 2026-06-05
- [x] Bước 9: Update tab layout (thêm Tickets tab) — 2026-06-05
- [x] Bước 10: `npx tsc --noEmit` + `npx eslint . --max-warnings=0` → PASS — 2026-06-05

## Câu hỏi đã giải đáp
- **TicketDetailDTO shape:** activities[] và comments[] embedded trong response GET /api/tickets/{id} — không cần separate endpoint cho activities
- **batteryAssetId:** Tên field nhất quán giữa request payload và response DTO (dạng string UUID)
- **Category enum:** Confirmed từ API docs: Charging, Overheat, NoPower, Performance, Repair, Other
- **Sprint:** Đã chuyển sang Sprint 2 (due 2026-06-13) do Sprint 1 đã quá hạn
- **endpoints.ts / queryKeys.ts:** Đã tồn tại từ GH-4 → action là modify (không create)
