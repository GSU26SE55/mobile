# Plan — GH-10: [Mobile] Customer Ticket Management

## Metadata
- **Status:** AS-BUILT (reference) | **Role:** Mobile | **Ngày:** 2026-06-14 (refactor as-built)
- **Issue:** #10 — https://github.com/GSU26SE55/mobile/issues/10
- **Sprint:** Sprint 2 (due: 2026-06-13)
- **Branch:** `fix-image-moblie`

> **Mục đích bản plan này:** Feature đã được implement xong. Tài liệu này được **viết lại as-built** —
> đối chiếu code thực tế (`src/features/tickets/**`, `app/(customer)/tickets/**`) ↔ `docs/api-ticket.md` —
> để làm **cấu trúc chuẩn tham khảo** cho FE (mobile + web `/frontend`). Không thay đổi code trong lần này.
>
> **Scope reframe (2026-06-14):** Issue #10 **chỉ còn Customer**. Phần Staff ticket → **#22**.
> Attachment upload đưa **vào scope** (đã hoạt động); hạ tầng FileStorage chuẩn hóa ở **#25** — issue này chỉ *consume* API.

---

## Mục tiêu
Quản lý ticket cho **Customer** trên Mobile: danh sách, tạo mới (kèm attachment), chi tiết +
activity timeline + comment, và các action vòng đời cuối (reopen, rate). Data flow chuẩn:
Screen → TanStack Query hook → `ticketService` → `axiosInstance` → BE.

## Scope
**Trong scope (Customer):**
- Ticket list — `GET /api/customer/tickets/me` (filter client-side all/open/closed, pagination)
- Create ticket — `POST /api/customer/tickets` (`title`, `description`, `category`, `batteryAssetId?`) + **attachment**
- Ticket detail — `GET /api/tickets/{id}` (activities + comments embedded; chỉ render `isInternal=false`)
- Add comment — `POST /api/tickets/{ticketId}/comments` (`isInternal=false`) + **attachment**
- Reopen — `POST /api/customer/tickets/{id}/reopen` (chỉ khi `status=ClosedPendingRate`; 403 nếu quá 7 ngày)
- Rate — `POST /api/customer/tickets/{id}/rate` (`rating` 1–5, `ratingComment?`; chỉ khi `status=ClosedPendingRate`)
- Tab "Tickets" trong Customer tab navigator

**Ngoài scope:**
- Staff/Manager/Admin ticket actions → **#22**
- Hạ tầng upload/download file chuẩn hóa (`lib/fileStorage`, `/api/files/*`) → **#25** (issue này chỉ consume)
- Internal comments (`isInternal=true` — chỉ Staff/Manager xem)
- Maintenance logs (Staff) — type `maintenanceLogs` chỉ là stub `unknown[] | null` để DTO compile đúng
- Push notification khi ticket đổi trạng thái

---

## Cấu trúc thư mục (as-built — đây là cấu trúc chuẩn tham khảo)

```
src/features/tickets/
├── types/
│   └── ticket.types.ts          ← re-export enums từ shared/enums + DTOs + payloads (KHÔNG define enum inline)
├── services/
│   └── ticket.service.ts        ← 6 method: getList, getDetail, create, addComment, reopen, rate
├── schemas/                     ← Zod, parse thủ công bằng safeParse (KHÔNG dùng React Hook Form)
│   ├── createTicket.schema.ts   ← CreateTicketForm
│   ├── comment.schema.ts        ← CommentForm + AttachmentForm
│   └── rateTicket.schema.ts     ← RateTicketForm
├── hooks/
│   ├── useTickets.ts            ← useQuery — list
│   ├── useTicketDetail.ts       ← useQuery — detail (enabled: !!id)
│   ├── useCreateTicket.ts       ← useMutation — invalidate KEY.tickets
│   ├── useAddComment.ts         ← useMutation(ticketId) — invalidate detail
│   ├── useReopenTicket.ts       ← useMutation(ticketId) — invalidate detail + list
│   ├── useRateTicket.ts         ← useMutation(ticketId) — invalidate detail + list
│   ├── useUploadTicketAttachment.ts   ← upload file khi create ticket (consume #25)
│   ├── useUploadCommentAttachment.ts  ← upload file khi comment (consume #25)
│   └── useAuthImageHeaders.ts   ← dựng header Bearer cho <Image> tải ảnh attachment (auth download)
└── components/
    ├── TicketCard.tsx           ← item danh sách
    ├── TicketStatusBadge.tsx    ← badge màu theo TicketStatusEnum
    ├── SlaCountdown.tsx         ← remainingPercent + dueAt (guard slaTimer != null)
    ├── ActivityTimeline.tsx     ← timeline từ activities[]
    ├── CreateTicketStepper.tsx  ← form tạo ticket nhiều bước (battery → category → mô tả → attachment)
    ├── CreateTicketSuccess.tsx  ← màn hình thành công sau khi tạo
    ├── RateModal.tsx            ← modal đánh giá 1–5 sao
    └── ReopenModal.tsx          ← modal confirm reopen + lý do

app/(customer)/
├── (tabs)/
│   ├── _layout.tsx              ← tab navigator (đã thêm tab "Tickets")
│   └── tickets.tsx              ← Ticket LIST screen (FlatList + filter all/open/closed + pull-to-refresh)
└── tickets/
    ├── [id].tsx                 ← Ticket DETAIL screen (info + SLA + timeline + comments + actions)
    └── create.tsx               ← Create ticket screen (state machine step + stepper)

src/lib/
├── endpoints.ts                 ← ENDPOINTS.TICKETS + ENDPOINTS.FILES
├── queryKeys.ts                 ← KEY.tickets + QUERY_KEY.tickets.{list,detail}
└── fileStorage.ts               ← (#25) wrapper upload/download — consume bởi 2 hook upload

src/shared/enums/
└── ticket.enum.ts               ← nguồn enum duy nhất (`as const` object + type alias)
```

> **Khác biệt so với plan gốc (đã chuẩn hóa):**
> - Create flow dùng `CreateTicketStepper` + `CreateTicketSuccess` (multi-step), **không** phải `CreateTicketForm.tsx`.
> - List screen là tab `(tabs)/tickets.tsx` (filter client-side), **không** phải `tickets/index.tsx`.
> - Thêm 3 hook attachment (`useUploadTicketAttachment`, `useUploadCommentAttachment`, `useAuthImageHeaders`) — do attachment nay trong scope.

---

## Enums

`ticket.types.ts` **chỉ re-export** từ `shared/enums/ticket.enum.ts` — không define inline. Pattern `as const` object + type alias.

| Enum | File nguồn |
|------|-----------|
| `TicketStatusEnum`, `TicketPriorityEnum`, `TicketCategoryEnum`, `TicketOriginEnum` | `shared/enums/ticket.enum.ts` |
| `ImpactScopeEnum`, `UrgencyLevelEnum`, `EscalationReasonEnum`, `SlaTimerStatusEnum` | `shared/enums/ticket.enum.ts` |
| `ActorRoleEnum`, `ActivityActionEnum` | `shared/enums/ticket.enum.ts` |

> `ActivityActionEnum` đã đủ tới `Closed=25` (khớp `docs/api-ticket.md`). `PauseReasonEnum`/`MaintenanceLogTypeEnum`
> cũng có trong file enum nhưng thuộc luồng Staff (#22) — không dùng trong UI Customer.

## Types / DTOs (as-built — `src/features/tickets/types/ticket.types.ts`)

```ts
// Khớp docs/api-ticket.md, với 3 điểm thực tế cần lưu ý:
interface TicketDTO {
  id; code; batteryAssetId: string | null; customerId;
  assignedStaffId: string | null;
  assignedStaffName?: string | null;          // ← thực tế BE có trả, doc chưa liệt kê → optional
  title; category; priority; impactScope; urgencyLevel; status; origin;
  reopenCount; isIncident; createdAt; updatedAt: string | null;
  slaTimer: SlaTimerDTO | null;                // ← NULLABLE (doc ghi non-null) — guard trước khi render SLA
}

interface TicketDetailDTO extends TicketDTO {
  description; resolutionSummary; resolvedAt; resolvedByStaffId;
  approvedAt; approvedByManagerId; rejectionReason; closedAt;
  rating: number | null; ratingComment; ratedAt;
  escalatedAt: string | null;
  escalationReason: EscalationReasonEnum | null;   // ← treat optional: check escalatedAt != null trước
  originAlertId;
  activities: TicketActivityDTO[] | null;
  comments: TicketCommentDTO[] | null;
  maintenanceLogs: unknown[] | null;               // ← stub ngoài scope (Staff #22)
  attachments: TicketAttachmentDTO[] | null;       // ← in scope: render ảnh qua auth download
}

interface TicketActionResponse {                   // wrapper RIÊNG, không phải CommonResponse<T>
  isSuccess; statusCode; message: string | null;
  data: { id: string | null; code: string | null; status: TicketStatusEnum } | null;
  listErrors: { field: string | null; detail: string | null }[] | null;
}

// Payloads
interface CreateTicketPayload { title; description; category: TicketCategoryEnum; batteryAssetId?; attachments?: CommentAttachmentPayload[]; }
interface AddCommentPayload   { body; isInternal: false; attachments?: CommentAttachmentPayload[]; }
interface RatePayload         { rating: number; ratingComment?: string; }
interface ReopenPayload       { reopenReason?: string; }
interface TicketListParams    { Status?: TicketStatusEnum; PageNumber?: number; PageSize?: number; }

// Attachment (consume #25)
interface UploadedTicketAttachment { uri; fileId; fileName; contentType; sizeBytes; }
interface CommentAttachmentPayload { fileId; fileName; contentType; sizeBytes; }
```

## Schemas (Zod — `safeParse` thủ công, không React Hook Form)

```ts
// createTicket.schema.ts
title:          z.string().trim().min(1).max(200)
description:    z.string().trim().min(1).max(2000)
category:       z.enum(['Charging','Overheat','NoPower','Performance','Repair','Other'])
batteryAssetId: z.string().uuid().optional()

// comment.schema.ts  (export CommentForm + AttachmentForm)
body:        z.string().min(1).max(1000)         // max là FE-only constraint
attachments: z.array(attachmentSchema).optional()  // { fileId, fileName, contentType, sizeBytes }

// rateTicket.schema.ts
rating:        z.number().int().min(1).max(5)
ratingComment: z.string().max(500).optional()    // max là FE-only constraint
```

## Endpoints

| Method | Path | Body / Query | Response |
|--------|------|--------------|----------|
| GET  | `/api/customer/tickets/me` | `?Status&PageNumber&PageSize` | `CommonResponse<PaginationResponse<TicketDTO>>` |
| POST | `/api/customer/tickets` | `CreateTicketPayload` | `TicketActionResponse` |
| GET  | `/api/tickets/{id}` | — | `CommonResponse<TicketDetailDTO>` |
| POST | `/api/tickets/{ticketId}/comments` | `AddCommentPayload` | `TicketActionResponse` |
| POST | `/api/customer/tickets/{id}/reopen` | `ReopenPayload` | `TicketActionResponse` |
| POST | `/api/customer/tickets/{id}/rate` | `RatePayload` | `TicketActionResponse` |
| POST | `/api/files/upload` (#25) | multipart file | `CommonResponse<{ fileId, fileName, contentType, size }>` |
| GET  | `/api/files/{id}/download` (#25) | — (cần `Authorization`) | binary (dùng `useAuthImageHeaders`) |

`ENDPOINTS.TICKETS` (as-built):
```ts
TICKETS: {
  CUSTOMER_LIST:   '/api/customer/tickets/me',
  CUSTOMER_CREATE: '/api/customer/tickets',
  DETAIL:  (id) => `/api/tickets/${id}`,
  COMMENT: (id) => `/api/tickets/${id}/comments`,
  REOPEN:  (id) => `/api/customer/tickets/${id}/reopen`,
  RATE:    (id) => `/api/customer/tickets/${id}/rate`,
}
```

## Workflow (luồng chính)

**Create ticket (stepper):**
```
create.tsx giữ state: step / selectedBatteryId / category / description / attachedFiles[]
  CreateTicketStepper → từng bước chọn battery → category → mô tả → đính kèm (upload qua useUploadTicketAttachment)
  handleSubmit → useCreateTicket.mutateAsync({ ...payload, attachments: attachedFiles.map(...) })
    → OK:   invalidate KEY.tickets → hiện CreateTicketSuccess (code + id)
    → FAIL: toast/Alert lỗi
```

**List (tab tickets.tsx):**
```
useTickets({ PageSize: 100 }) → allTickets
  filter client-side: all / open / closed (open = không thuộc Resolved/Closed/ClosedPendingRate/ClosedRejected)
  FlatList + RefreshControl (pull-to-refresh refetch) → tap card → router push detail
```

**Detail ([id].tsx):**
```
useTicketDetail(id) → render info + PriorityBadge + SlaCountdown (guard slaTimer) + ActivityTimeline
  comments: chỉ render isInternal=false; ảnh attachment tải qua <Image source={{ uri, headers: useAuthImageHeaders() }}>
  Comment: commentSchema.safeParse({ body, attachments }) → useAddComment(id).mutateAsync → invalidate detail
  Rate:   chỉ khi status===ClosedPendingRate → RateModal → useRateTicket → invalidate detail + list
  Reopen: chỉ khi status===ClosedPendingRate → ReopenModal → useReopenTicket → invalidate detail + list
          403 → toast "Đã quá 7 ngày để mở lại ticket"
```

## Edge Cases
- **`slaTimer` null:** `SlaCountdown` phải guard `slaTimer != null` trước khi đọc `remainingPercent`/`dueAt`.
- **`escalationReason`:** chỉ tin khi `escalatedAt != null` (BE trả `0`/null default khi chưa escalate).
- **Comment internal:** `isInternal` hardcode `false`; render filter ẩn `isInternal=true`.
- **Rate/Reopen:** chỉ render nút khi `status === 'ClosedPendingRate'`.
- **Reopen 403 (quá 7 ngày / sai trạng thái):** toast nghiệp vụ thay vì generic error (map `HttpError`).
- **Attachment download cần auth:** `<Image>` phải đính `Authorization: Bearer` qua `useAuthImageHeaders` (GET `/api/files/{id}/download`).
- **Empty list / error / loading:** hiển thị state tương ứng trong tab list.
- **`maintenanceLogs`:** stub `unknown[] | null` — không render ở UI Customer.

## Acceptance Criteria
- [x] Danh sách ticket hiển thị, filter all/open/closed + pull-to-refresh hoạt động
- [x] Create ticket: stepper validate inline + đính kèm + submit → ticket mới xuất hiện trong list, hiện màn success
- [x] Detail hiển thị info + SLA (guard null) + activities (embedded) + comments (ẩn internal)
- [x] Comment kèm attachment ảnh tải được qua auth header
- [x] Rate + Reopen chỉ xuất hiện khi `status=ClosedPendingRate`; reopen 403 → toast đúng nghiệp vụ
- [x] Quality gate: `npx tsc --noEmit` PASS — "No errors found" (rà lại 2026-06-14)
- [ ] `npx eslint . --max-warnings=0` — còn warning baseline `no-redeclare` (pattern `export const`+`export type`, có trước thay đổi này)

## Steps (as-built — đã hoàn thành)
- [x] Bước 1: `src/lib/endpoints.ts` — `ENDPOINTS.TICKETS` + `ENDPOINTS.FILES`
- [x] Bước 2: `src/features/tickets/types/ticket.types.ts` — re-export enums + DTOs + payloads
- [x] Bước 3: schemas — `createTicket` / `comment` (+AttachmentForm) / `rateTicket`
- [x] Bước 4: `services/ticket.service.ts` — 6 method
- [x] Bước 5: hooks — `useTickets`, `useTicketDetail`, `useCreateTicket`, `useAddComment`, `useReopenTicket`, `useRateTicket`
- [x] Bước 6: hooks attachment — `useUploadTicketAttachment`, `useUploadCommentAttachment`, `useAuthImageHeaders` (consume #25)
- [x] Bước 7: components — `TicketCard`, `TicketStatusBadge`, `SlaCountdown`, `ActivityTimeline`, `CreateTicketStepper`, `CreateTicketSuccess`, `RateModal`, `ReopenModal`
- [x] Bước 8: screens — `(tabs)/tickets.tsx`, `tickets/[id].tsx`, `tickets/create.tsx`
- [x] Bước 9: thêm tab "Tickets" vào `(tabs)/_layout.tsx`
- [x] Bước 10: reconcile type/enum ↔ `docs/api-ticket.md` (2026-06-14)

## Câu hỏi đã giải đáp
- **Deliverable:** chỉ refactor `logs/GH-10/plan.md` (mobile) thành as-built chuẩn — không đụng code.
- **Scope:** chỉ Customer (theo issue reframe). Staff → #22, FileStorage infra → #25. Đã bỏ toàn bộ note Staff (S1–S5) khỏi plan GH-10.
- **`/frontend` (web):** lần này chỉ là tham khảo/động lực — không tạo gì trong repo `/frontend`. Cấu trúc thư mục ở trên là bản chuẩn để FE web map theo `fe.md` sau này (pages/components/hooks/services/schemas/types).
- **Activities/comments:** embedded trong `GET /api/tickets/{id}` — không gọi endpoint riêng.
- **Attachment:** nay trong scope GH-10 (consume API #25), không còn "ngoài scope" như plan gốc.
