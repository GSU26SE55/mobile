# Plan — GH-44: [Mobile] Bổ sung ticket & KB endpoints còn thiếu + SignalR realtime

## Metadata
- **Status:** IN_PROGRESS | **Role:** Mobile (FE) | **Ngày:** 2026-06-22
- **Issue:** #44 — https://github.com/GSU26SE55/mobile/issues/44
- **Sprint:** Sprint 3 (due 2026-06-27)
- **Dev:** Trần Minh Trí

## Mục tiêu
Bổ sung 7 REST endpoint còn thiếu + 1 SignalR realtime hub cho màn ticket detail
(Customer + Staff). Đồng thời **fix/rewire** các chỗ hiện đang dùng workaround không
khớp BE contract (comments/activities chỉ đọc từ embed của detail, KB suggest đang
fake client-side). Output: data layer đầy đủ (endpoints + service + hook + types + enum
+ queryKeys) **và** wire vào 2 màn detail để hoạt động thực tế.

## Scope
**Trong scope:**
- 8 item trong issue (7 REST + SignalR) — gộp thành 1 task lớn.
- Fix các điểm chưa phù hợp:
  - Comments: dùng GET paginated `/tickets/{id}/comments` thay vì chỉ đọc `ticket.comments` embed.
  - Activities: dùng GET `/tickets/{id}/activities` thay vì chỉ đọc `ticket.activities` embed.
  - KB suggest: thay `useRelatedKb` (fetch theo `relatedKbArticleIds` + fallback category) bằng `/knowledge-base/suggest?TicketId=` server-driven.
- Staff: thêm sửa maintenance log (PATCH), gán/gỡ KB reference (POST/DELETE), lịch sử bảo trì cá nhân (`/me`).
- Realtime: lib `@microsoft/signalr`, wire `CommentAdded` + `UserTyping` vào tab comments của 2 màn detail.

**Ngoài scope:**
- Toàn bộ `/api/admin/tickets/*` (triage/assign/reassign/approve/reject/escalate/declare-incident/queue) — Web only.
- KB admin/internal workflow (create/update/publish/archive/rollback/approve-review) — Web only.
- Saga debug, Health metrics.
- KB usage analytics (`/knowledge-base/{id}/usage`).

## Endpoints
| Method | Path | Item | Trạng thái | Mục đích |
|--------|------|------|-----------|----------|
| GET | `/api/tickets/{id}/comments?page&pageSize` | #1 | path đã có (COMMENT) | List comment phân trang; Customer chỉ thấy `isInternal=false` |
| GET | `/api/tickets/{id}/activities` | #2 | **thêm** | Timeline (không pagination, mới→cũ) |
| GET | `/api/staff/tickets/maintenance-logs/me` | #3 | **thêm** | Lịch sử bảo trì cá nhân, group theo ticket |
| PATCH | `/api/tickets/{ticketId}/maintenance-logs/{logId}` | #4 | **thêm** | Partial update log (chủ sở hữu log) |
| POST | `/api/knowledge-base/references` | #5 | **thêm** | Gán KB vào ticket (body: ticketId, kbArticleId, referenceType, note?) |
| DELETE | `/api/knowledge-base/references/{referenceId}` | #6 | **thêm** | Gỡ KB reference (soft delete) |
| GET | `/api/knowledge-base/suggest?TicketId={id}` | #7 | **thêm** | Gợi ý ≤5 bài Published theo ticket |
| SignalR | `/hubs/ticket-comments?access_token=` | #8 | **thêm** | `CommentAdded` / `UserTyping`; method `JoinTicket`/`LeaveTicket`/`Typing` |

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/endpoints.ts` | modify | + `TICKETS.ACTIVITIES`, `STAFF_TICKETS.MY_MAINTENANCE_LOGS`, `STAFF_TICKETS.MAINTENANCE_LOG_ITEM(ticketId,logId)`, `KB_REFERENCES.ITEM(refId)`, `KNOWLEDGE_BASE.SUGGEST`. (COMMENT, KB_REFERENCES.LIST tái dùng cho GET/POST) |
| `src/lib/queryKeys.ts` | modify | + `tickets.comments(id)` (infinite, KHÔNG cần biến thể params — chỉ 1 view, page do useInfiniteQuery quản), `tickets.activities(id)`, `staffTickets.myLogs()`, `kb.suggest(ticketId)` |
| `src/shared/enums/kb.enum.ts` | modify | + `KbReferenceTypeEnum` (as const) + `KbReferenceTypeLabel` |
| `src/features/tickets/types/ticket.types.ts` | modify | + `CommentListParams`, `UpdateMaintenanceLogPayload`, `StaffMaintenanceLogGroupDTO`, `TicketActivityDTO` (shape BE: `CommonResponse<List<TicketActivityDTO>>`) |
| `src/features/kb/types/kb.types.ts` | modify | + `KbArticleSuggestDTO` (shape BE: `id, code, title, symptoms, helpfulCount, viewCount` — **KHÔNG** có `category`/`status`/`reviewRequired` như `KbArticleSummaryDTO` cũ), `AddKbReferencePayload` |
| `src/features/tickets/services/ticket.service.ts` | modify | + `getComments(id,params)`, `getActivities(id)` |
| `src/features/staff/services/staffTicket.service.ts` | modify | + `getMyMaintenanceLogs()`, `updateMaintenanceLog(ticketId,logId,payload)` |
| `src/features/kb/services/kb.service.ts` | modify | + `suggest(ticketId)`, `addReference(payload)`, `removeReference(refId)` |
| `src/features/tickets/hooks/useTicketComments.ts` | create | GET paginated bằng `useInfiniteQuery` (đã chốt — xem Approach #1) |
| `src/features/tickets/hooks/useTicketActivities.ts` | create | GET activities |
| `src/features/tickets/hooks/useTicketCommentsRealtime.ts` | create | SignalR connection lifecycle (#8) |
| `src/features/staff/hooks/useMyMaintenanceLogs.ts` | create | GET `/me` (#3) |
| `src/features/staff/hooks/useUpdateMaintenanceLog.ts` | create | PATCH (#4) |
| `src/features/kb/hooks/useKbSuggest.ts` | create | GET suggest (#7) — thay `useRelatedKb` |
| `src/features/kb/hooks/useAddKbRef.ts` | create | POST reference (#5) |
| `src/features/kb/hooks/useRemoveKbRef.ts` | create | DELETE reference (#6) |
| `src/features/staff/components/MaintenanceLogForm.tsx` | modify | nhận `initialValues?` để tái dùng cho edit (PATCH) |
| `src/features/staff/components/KbReferencePicker.tsx` | create | Modal chọn bài KB (từ suggest) để gán reference |
| `src/features/kb/components/KbRelatedSection.tsx` | modify | dùng `useKbSuggest` thay `useRelatedKb` |
| `src/features/kb/hooks/useRelatedKb.ts` | delete | thay bằng `useKbSuggest` (chuyển sang server-driven) |
| `app/(customer)/tickets/[id].tsx` | modify | comments→`useTicketComments`; activities→`useTicketActivities`; wire realtime |
| `app/(staff)/tickets/[id].tsx` | modify | như trên + edit log (PATCH) + add/remove KB ref + realtime |

## Approach

### Comments (#1) — CHỐT `useInfiniteQuery` (không phải page-state)
- AC yêu cầu "scroll tải thêm" ⇒ **bắt buộc `useInfiniteQuery`**, mirror `useKbInfiniteList`:
  - `queryKey: QUERY_KEY.tickets.comments(ticketId)`, `initialPageParam: 1`, `pageSize: 10` (default BE).
  - `getNextPageParam: (last) => last?.hasNextPage ? last.pageNumber + 1 : undefined`.
  - Service gửi đúng tên param controller: `{ page, pageSize }` (**không** phải `PageNumber`/`PageSize`).
- **Thứ tự BE = DESC (newest-first)** — handler thực tế `OrderByDescending(c => c.CreatedAt)` (XML-doc controller ghi "ASC" là **SAI**, code thắng). ⇒ page 1 = comment mới nhất. UI render **newest-first** (flatten các page theo thứ tự trả về); **bỏ** giả định chat `scrollToEnd` cũ (không còn đúng với DESC).
- BE tự lọc `isInternal` cho Customer ⇒ client không cần filter làm "nguồn sự thật".

### Realtime cache strategy (#8) — realtime là NGUỒN CẬP NHẬT CHÍNH
> Backend facts: `CommentAdded` đẩy **full `TicketCommentDTO`** qua `Clients.Group(...)` ⇒ **người gửi cũng nhận lại comment của chính mình**. Nếu POST còn invalidate nữa ⇒ double refetch / nhấp nháy. Quyết định:
- `useTicketCommentsRealtime(ticketId)` build `HubConnection`:
  - **URL hub = `${BASE_URL}/hubs/ticket-comments`** (KHÔNG strip gì). Verify: `axios.ts:16` `BASE_URL = http://localhost:5000` — **không** chứa `/api` (prefix `/api` nằm trong từng path ở `endpoints.ts`, không ở baseURL). Hub gắn ở root, không có prefix `/api`. → an toàn ghép thẳng. (Phòng xa: nếu sau này ai set `EXPO_PUBLIC_API_URL` có đuôi `/api`, mới cần `BASE_URL.replace(/\/api$/, '')` — ghi rõ điều kiện này, KHÔNG strip vô điều kiện.)
  - `accessTokenFactory: getAccessToken` (lib tự gắn `?access_token=`, tự lấy token mới khi reconnect).
  - `withAutomaticReconnect()`. `JoinTicket(ticketId)` sau khi `start()`; `LeaveTicket(ticketId)` + `stop()` khi unmount / đổi ticket.
  - `on('CommentAdded', dto)` → **`queryClient.setQueryData(tickets.comments(ticketId))`**: prepend `dto` vào **page đầu** (DESC ⇒ mới nhất lên đầu), **dedup theo `dto.id`** (bỏ qua nếu đã có). KHÔNG refetch.
  - `on('UserTyping', ticketId, userId, name)` → set typing state tạm (auto-clear ~3s). (`OthersInGroup` ⇒ người gửi không thấy typing của mình.)
  - Hook expose `isConnected`.
- **POST comment `onSuccess`:** chỉ clear composer. **KHÔNG invalidate** khi `isConnected` — để hub đẩy `CommentAdded` về và `setQueryData` append (dedup chống trùng).
  - **Fallback** khi `!isConnected` (WS bị chặn / connect fail): mới `invalidateQueries(tickets.comments(id))`. Dedup-by-id đảm bảo an toàn kể cả khi cả 2 đường cùng chạy.
- Lỗi connect chỉ log, không block UI — REST (`useInfiniteQuery`) vẫn là fallback đầy đủ.

### Activities (#2)
- `useTicketActivities(ticketId)` — `useQuery` đơn giản; BE trả `CommonResponse<List<TicketActivityDTO>>` (full array, **không pagination**, sort **mới→cũ** sẵn từ BE), `staleTime` ngắn; thay `ticket.activities` embed trong `ActivityTimeline`. Cần thêm type `TicketActivityDTO` (chưa có ở FE).

### KB suggest (#7)
- `useKbSuggest(ticketId)` → `GET /knowledge-base/suggest?TicketId=` (param **`TicketId`**, Guid). DTO trả về là `KbArticleSuggestDTO` shape **mới** (`id, code, title, symptoms, helpfulCount, viewCount`) — **khác** `KbArticleSummaryDTO` mà `useRelatedKb` cũ trả (`category/status/reviewRequired`). ⇒ `KbRelatedSection` phải đổi cả render theo shape mới (hiển thị `symptoms` thay vì `category/status`). `KbReferencePicker` cũng dùng shape này. **Xóa** `useRelatedKb`.

### KB references (#5/#6)
- Staff tab KB: nút "Gán bài viết" mở `KbReferencePicker` (list từ `useKbSuggest`) → `useAddKbRef` (body: `ticketId`, `kbArticleId`, `referenceType` dạng **chuỗi**, `note?`); mỗi ref có nút xóa → `useRemoveKbRef`. Cả 2 invalidate `kb.related(ticketId)` (GET refs hiện dùng key này).

### Maintenance log /me (#3) + PATCH (#4)
- `useMyMaintenanceLogs` cho lịch sử cá nhân; `useUpdateMaintenanceLog` + `MaintenanceLogForm` với `initialValues` để sửa log trong tab logs Staff. Invalidate `staffTickets.detail(id)` sau PATCH.

## Backend facts đã verify (đọc trực tiếp source TicketService — đường dẫn kèm)
| Điểm | Sự thật từ code | Nguồn |
|------|-----------------|-------|
| GET comments sort | `OrderByDescending(c => c.CreatedAt)` — **newest-first** (XML-doc controller ghi ASC là **sai**, code thắng) | `Handler/Comments/TicketCommentsQueryHandler.cs` |
| GET comments param | controller `[FromQuery] int page = 1, int pageSize = 10` — đúng `?page=&pageSize=`, default **10** | `Controllers/TicketCommentsController.cs` |
| Pagination shape | `PaginationResponse<T>`: `items, totalItems, pageNumber, pageSize, totalPages, hasNextPage, hasPreviousPage` (computed) → `getNextPageParam: last?.hasNextPage ? last.pageNumber+1` **đúng** | `SharedContracts/Common/Responses/PaginationResponse.cs` |
| `TicketCommentDTO` payload | `id, ticketId, **authorUserId**, authorRole, authorDisplayName, body, isInternal, attachmentFileIds, createdAt` (đủ field cho prepend) | `DTOs/Response/Tickets/TicketCommentDTO.cs` + handler |
| `CommentAdded` routing | notifier gửi `Clients.Group(public **HOẶC** internal)` theo `comment.IsInternal`; sender ở trong group ⇒ **người gửi NHẬN LẠI** comment của mình | `Realtime/SignalRTicketCommentNotifier.cs` |
| Group | `JoinTicket` add `public`; nếu `CanViewInternalComments` (Staff/Manager/Admin) add thêm `internal`. Comment `isInternal=true` chỉ vào internal group ⇒ Customer **không** nhận qua realtime | `Realtime/TicketCommentHub.cs` |
| `UserTyping` | `Clients.OthersInGroup(PublicGroup)` — args `(ticketIdStr, userId, displayName)`; sender không nhận; **chỉ broadcast vào public group** | `Realtime/TicketCommentHub.cs` |
| Hub methods | `JoinTicket(string)`, `LeaveTicket(string)`, `Typing(string)` — tham số **string** (không phải Guid) | `Realtime/TicketCommentHub.cs` |
| Enum serialization | Global `JsonStringEnumConverter` (REST + SignalR `PayloadSerializerOptions`) + `CamelCase` ⇒ enum gửi/nhận **dạng chuỗi**, JSON **camelCase** | `Api/Program.cs:19-21,49-50` |
| `KbReferenceTypeEnum` | `ConsultedDuringResolve=1 / ProvidedToCustomer=2 / GeneratedAfterResolve=3` — gửi chuỗi (vd `"ConsultedDuringResolve"`) | `Domain/Enums/KbReferenceTypeEnum.cs` |
| Activities endpoint | `GET /api/tickets/{id}/activities` **đã tồn tại** → `CommonResponse<List<TicketActivityDTO>>`, sort **mới→cũ**, không pagination | `Controllers/TicketsController.cs:76` |
| Suggest endpoint | `GET /api/knowledge-base/suggest?TicketId=` → `CommonResponse<List<KbArticleSuggestDTO>>` (≤5 Published). DTO: `id, code, title, symptoms, helpfulCount, viewCount` | `Controllers/KnowledgeBaseController.cs:78` + `KbArticleSuggestDTO.cs` |
| AddRef body | `AddTicketKbReferenceCommand`: `ticketId, kbArticleId, referenceType (chuỗi), note?` → trả `CommonResponse<object>` (200/403/404). **Upsert**: nếu ref đã soft-deleted thì reactivate (không tạo trùng) | `Command/.../AddTicketKbReferenceCommand.cs` + handler |

## Edge Cases
- **Double-update (người gửi nhận lại CommentAdded):** hub gửi cả người gửi ⇒ realtime `setQueryData` append dedup-by-id là nguồn chính; POST KHÔNG invalidate khi connected. Tránh nhấp nháy/double refetch.
- **Dedup khi cả realtime + fallback chạy:** `setQueryData` bỏ qua nếu `dto.id` đã tồn tại ⇒ idempotent.
- Comment POST khi mất mạng → `handleErrorApi` toast; realtime broadcast fail KHÔNG ảnh hưởng (BE catch nội bộ, vẫn trả 201).
- SignalR: token hết hạn lúc handshake → reconnect dùng `accessTokenFactory` lấy token mới; nếu vẫn fail → fallback hoàn toàn về REST (`!isConnected` ⇒ POST invalidate). UI không vỡ.
- DESC order: comment mới prepend lên đầu page 1; render newest-first, bỏ `scrollToEnd` cũ.
- PATCH log: BE trả `403` ở **2 điều kiện** (verify `MaintenanceLogUpdateCommandHandler.cs`): (a) ticket `Resolved`/`ClosedPendingRate`/`Closed` (status lock) → disable nút edit theo status; (b) `log.StaffId != currentUserId` (chỉ chủ log mới sửa, Manager/Admin KHÔNG override qua endpoint này) → chỉ hiện nút edit trên log của chính mình. `404` nếu log không tồn tại / không thuộc ticket.
- POST KB ref: BE trả `403` ở **2 điều kiện** (verify `AddTicketKbReferenceCommandHandler.cs`): (a) ticket `Resolved`/`ClosedPendingRate`/`Closed` → ẩn/disable nút "Gán bài viết"; (b) role Staff nhưng **không phải** `AssignedStaffId` của ticket → ẩn nút gán (Manager/Admin gán bất kỳ ticket nào). `404` nếu ticket/bài không tồn tại → toast.
- Suggest: `404` nếu ticket không tồn tại → hiển thị empty state, không crash.
- `KbReferenceTypeEnum` BE nhận **chuỗi** (vd `"ConsultedDuringResolve"`), không phải int.
- Customer KHÔNG thấy comment `isInternal` — không filter ở client làm "nguồn sự thật", tin BE.

## Acceptance Criteria
- [ ] Tab comments (Customer + Staff) load qua `GET /comments` bằng `useInfiniteQuery`, scroll chạm đáy → `fetchNextPage` (newest-first).
- [ ] Sau khi gửi comment, list cập nhật qua realtime `setQueryData` (KHÔNG refetch, không nhấp nháy); nếu hub mất kết nối → fallback invalidate.
- [ ] Comment mới từ user khác hiện realtime qua SignalR khi đang mở ticket (không cần refresh); không bị trùng comment (dedup theo id).
- [ ] Tab activities load qua `GET /activities`.
- [ ] Staff sửa được maintenance log (PATCH) và bị chặn khi ticket đã đóng.
- [ ] Staff gán + gỡ được KB reference; danh sách refs cập nhật ngay.
- [ ] KB gợi ý hiển thị từ `/suggest` (≤5 bài), `useRelatedKb` đã gỡ.
- [ ] `npx tsc --noEmit` PASS, `npx expo lint` không lỗi.

## Steps
- [ ] Bước 1: Endpoints + queryKeys + `KbReferenceTypeEnum` enum
- [ ] Bước 2: Types (comment params, update log payload, suggest DTO, group DTO, add-ref payload)
- [ ] Bước 3: Services (ticket: comments/activities; staffTicket: /me + PATCH; kb: suggest/add/remove ref)
- [ ] Bước 4: Hooks REST (useTicketComments, useTicketActivities, useMyMaintenanceLogs, useUpdateMaintenanceLog, useKbSuggest, useAddKbRef, useRemoveKbRef)
- [ ] Bước 5: SignalR — cài `@microsoft/signalr` + `useTicketCommentsRealtime`
- [ ] Bước 6: Rewire UI — customer `[id].tsx` (comments/activities/suggest/realtime)
- [ ] Bước 7: Rewire UI — staff `[id].tsx` (+ edit log, add/remove KB ref) + `KbReferencePicker` + `MaintenanceLogForm` initialValues; xóa `useRelatedKb`
- [ ] Bước 8: `npx tsc --noEmit` + `npx expo lint` → PASS

## Câu hỏi đã giải đáp
- **SignalR gộp hay tách? (task-size — quyết định của Leader):** → **Leader (Trí) CHỐT gộp** tất cả 8 item vào GH-44. Chấp nhận trade-off PR lớn vs DoD `/kltn-reviewcode` PASS. **Mitigation:** commit theo từng Bước (8 commit rạch ròi), reviewer review theo nhóm chức năng (REST data-layer → SignalR → rewire UI). Không phải warning tồn đọng — là quyết định đã chốt.
- **Chỉ data layer hay wire UI + fix?** → Wire UI đầy đủ và fix các chỗ chưa phù hợp (comments/activities chuẩn hóa, KB suggest server-driven).
- **#7 suggest vs useRelatedKb?** → Thay `useRelatedKb` bằng `useKbSuggest` (đúng BE contract).
- **#1/#2 mục đích?** → Chuyển từ đọc embed sang GET riêng (comments phân trang, cập nhật sau post qua realtime `setQueryData` + fallback invalidate khi mất kết nối — xem Approach #8; activities standalone).

## Lưu ý
> Task lớn (8 endpoint + SignalR + rewire 2 màn detail) — Leader đã chốt gộp (xem "Câu hỏi đã giải đáp").
> Khi `/kltn-implement`, commit theo từng Bước (8 commit) để PR review được theo nhóm.
> `KbReferenceTypeEnum` gửi BE dạng **chuỗi**: `"ConsultedDuringResolve"` / `"ProvidedToCustomer"` /
> `"GeneratedAfterResolve"` (int 1/2/3 chỉ là thứ tự enum BE, FE KHÔNG gửi số).
