# Plan — GH-1176: Revise Ticket Status and SLA Workflow (Mobile Client)

## Metadata

- Status: **IMPLEMENTED**
- User Decision: **APPROVED_FOR_IMPLEMENTATION** (user command: `implement`, 2026-08-12)
- Implementation authority: chỉ user được đổi status thành **APPROVED_FOR_IMPLEMENTATION**.
- Scope: Expo/React Native mobile client.
- Supported roles: **Customer và Staff**.
- Approved deviation: **Manager web-only**. Mobile không thêm auth/navigation/screen/service/mutation cho Manager; mobile chỉ render state và dữ liệu do Manager action trên web/backend tạo ra.
- Date reviewed: 2026-08-12 (Asia/Bangkok).
- Implementation: **completed 2026-08-12**. Manager remains web-only; mobile uses server-authoritative fallbacks for the documented API gaps.

## Sources và nguyên tắc đối chiếu

Nguồn nghiệp vụ duy nhất:

1. `D:\Projects\KLTN\AI\backend\.gemini\kb\index.md`
2. `D:\Projects\KLTN\AI\backend\.gemini\kb\modules\ticket-service.md`
3. `D:\Projects\KLTN\AI\backend\logs\GH-1176\plan.md`
4. `D:\Projects\KLTN\AI\backend\docs\api-ticket.md`

Review Board được đọc theo yêu cầu bổ sung của user trong `D:\Projects\KLTN\AI\backend\.gemini`; các blocking/recommended item của board được phản ánh trong revision này.

Source mobile hiện tại trong `app/`, `src/`, `package.json` được đọc để lập file impact. Backend controller/command/DTO/handler hiện tại chỉ được dùng để xác minh **API thực tế**. Không dùng `.agents` hoặc `.codex` làm hướng dẫn dự án.

## Quyết định scope đã chốt

### Lifecycle enum canonical

| TicketStatusEnum | Numeric value | JSON REST |
|---|---:|---|
| `Open` | 1 | `"Open"` |
| `Pending` | 2 | `"Pending"` |
| `InProgress` | 3 | `"InProgress"` |
| `Request` | 4 | `"Request"` |
| `ReAssign` | 5 | `"ReAssign"` |
| `Completed` | 6 | `"Completed"` |
| `Closed` | 7 | `"Closed"` |
| `ClosedRejected` | 8 | `"ClosedRejected"` |

Backend cấu hình `JsonStringEnumConverter`; mobile gửi/nhận enum bằng **tên string, case-sensitive theo tên canonical**, không serialize numeric value.

Phải xóa mọi UI/type/guard/filter/grouping phụ thuộc status cũ:

- `New`
- `Assigned`
- `WaitingCustomer`
- `WaitingParts`
- `WaitingOnsiteSchedule`
- `Resolved`
- `Escalated`
- `ClosedPendingRate`
- `Incident`

Scan cleanup phải phân biệt status dependency với tên hợp lệ ở domain khác, ví dụ environmental incident, alert `Resolved`, activity `IncidentDeclared`, hoặc historical action name.

### Manager web-only

- Không tạo `(manager)` route group, Manager screens, Manager hooks/services/forms hoặc sửa auth redirect để đưa Manager vào mobile.
- Assign/schedule, escalation decision, reassignment, completion approval/rejection, triage reject và declare incident là external action từ web/backend.
- Mobile Customer/Staff vẫn phải render đúng các state/result do những action đó tạo ra và phải refetch đủ nhanh.
- Manager steps trong e2e mobile dùng backend fixture/API test client hoặc web fixture; không tạo Manager UI trong mobile.

## Current-client findings

1. Mobile enum và status groups vẫn dùng lifecycle cũ ở badge, card, detail, action bar, customer tabs, staff dashboard/customer lists và Bubble Chat.
2. Client vẫn có `/start` endpoint/service/hook/action dù GH-1176 loại bỏ action này.
3. Hold hiện thiếu appointment bắt buộc; resume gửi body rỗng; completion vẫn dùng semantic `Resolved`; rating/reopen guard dựa trên `ClosedPendingRate`/`ClosedRejected` cũ.
4. `SlaCountdown` dựa chủ yếu vào timer status, chưa chặn theo ticket status và `Urgent`.
5. Ticket chat SignalR `/hubs/ticket-chats` chỉ là chat/reaction, không phải lifecycle signal.
6. Root đang mount hai notification connection: `NotificationBootstrap` → `useNotificationStream` và `NotificationsRealtimeSync` → `useNotificationsRealtime`.
7. `useTickets.ts`, `useStaffTickets.ts`, `useStaffDashboardStats.ts` và detail hooks chưa sở hữu polling/refetch lifecycle phù hợp.
8. Package hiện không có unit/component/e2e runner; chỉ có Expo lint/TypeScript dependencies.

## Role và workflow matrix

| Flow/state | Customer mobile | Staff mobile | Manager web/backend dependency |
|---|---|---|---|
| Assign + schedule | Xem assignee, priority, `Pending/Scheduled` + lịch hoặc `InProgress`; không action | Xem assignment; không có Start; future schedule là read-only cho tới activation | Assign/schedule trên web. Current window → `InProgress`; future → `Pending/Scheduled` |
| Hold | Xem `Pending/Held`, reason và lịch hẹn; nhận notification | Chỉ active PrimaryHandler, từ non-Urgent `InProgress`; nhập reason + note + future appointment | Chỉ quan sát |
| Early resume | Xem state đổi | Chỉ active PrimaryHandler và `Pending/Held`; reason bắt buộc. Không hiện cho `Pending/Scheduled` | Không action |
| Escalation request | Xem `Request` = đang chờ quyết định; không countdown | Chỉ active PrimaryHandler, non-Urgent `InProgress`; reason enum + note bắt buộc theo handler | Approve/reject bằng `escalation-decision` |
| `ReAssign` | Xem đang chờ điều phối; không countdown | Previous Primary không còn lifecycle action; retained eligible Primary vẫn chờ Manager | Chọn Primary mới hoặc giữ Primary đủ tier, kèm schedule |
| Completion | Xem `Completed` = chờ review; chưa rate/reopen | Primary Staff `InProgress → Completed`, nhập resolution summary | Approve → `Closed`; reject → `InProgress` |
| Rating | Chỉ owner, non-merged `Closed`, chưa rate, trong 7 ngày; rating không đổi status | Read-only | Read-only/report |
| Reopen | Chỉ owner, non-merged `Closed`, chưa rate, trong 7 ngày; reason bắt buộc; kết quả `Open` | Read-only/history | Sau reopen thực hiện assignment cycle mới trên web |
| `ClosedRejected` | Terminal; hiển thị rejection reason; không rate/reopen | Terminal/read-only | Tạo bởi triage reject |
| Incident | Không có lifecycle status `Incident`; render `isIncident`, `activeIncidentEpisodeId`, priority `Urgent` nếu API trả | Render metadata; Urgent không có SLA countdown | Declare incident là Manager web action |

## Exact API contract đã đối chiếu

### Serialization và common action response

- JSON property naming: camelCase.
- Enum: string qua `JsonStringEnumConverter`.
- Request time: `DateTimeOffset` ISO-8601 có `Z` hoặc explicit offset.
- DTO time: JSON ISO-8601 string; field có hậu tố `Utc` phải được parse/render như một instant UTC.

Mọi mutation bên dưới trả envelope `TicketActionResponse`:

| JSON field | Type | Nullable/omission | Ghi chú |
|---|---|---|---|
| `isSuccess` | `boolean` | non-null | `true` khi thành công |
| `statusCode` | `integer` | non-null | Trùng HTTP response status trong controller |
| `message` | `string` | non-null | Human-readable; hiện là error discriminator chính cho handler failures |
| `data` | `TicketActionDTO \| null` | nullable | Success có action DTO; failure thường null |
| `listErrors` | `Array<{field: string, detail: string}>` | non-null, thường `[]` | Validation pipeline trả chi tiết field ở HTTP 400 |

`TicketActionDTO`:

| JSON field | Type | Nullable/omission | Enum/semantics |
|---|---|---|---|
| `id` | `string` UUID | non-null | Ticket id trong các handler GH-1176 |
| `ticketId` | `string` UUID | nullable, **omitted when null** | Không được giả định luôn có |
| `code` | `string` | non-null | Ticket code |
| `status` | `TicketStatusEnum` string | non-null | Một trong 8 string canonical |
| `warnings` | `string[]` | nullable, **omitted when null** | Client type hiện thiếu field này |

Action response không chứa full updated ticket snapshot. Mọi success phải invalidate/refetch detail, list, activities và dashboard liên quan; không dựng state lâu dài chỉ từ `data.status`.

Backend hiện **không có machine-readable error code** như `code: "TICKET_STALE"`. Contract thực tế chỉ có HTTP status + `message` + validation `listErrors`. Bảng dưới ghi đúng status/reason class quan sát được; UI mapping theo message chỉ là fallback tạm thời và là contract gap cần backend quyết định.

### Ticket DTO fields ảnh hưởng GH-1176

`TicketDetailDTO` kế thừa toàn bộ `TicketDTO` và thêm detail fields.

| DTO | JSON field | Type | Nullable | Enum/semantics |
|---|---|---|---|---|
| `TicketDTO` | `status` | `string` | no | 8 `TicketStatusEnum` canonical |
| `TicketDTO` | `priority` | `string` | yes | `P1Critical`, `P2High`, `P3Normal`, `Urgent` |
| `TicketDTO` | `scheduledStartAtUtc` | ISO date-time `string` | yes | Appointment/activation instant |
| `TicketDTO` | `scheduleVersion` | `integer` | no | Monotonic schedule version |
| `TicketDTO` | `pendingContext` | `string` | yes | `Scheduled` hoặc `Held`; chỉ có ý nghĩa khi `Pending` |
| `TicketDTO` | `pendingReason` | `string` | yes | `CustomerUnavailable` hoặc `WorkBlocked`; expected cho `Pending/Held` |
| `TicketDTO` | `activeIncidentEpisodeId` | UUID `string` | yes | Incident metadata, không phải lifecycle status |
| `TicketDTO` | `isIncident` | `boolean` | no | Incident metadata |
| `TicketDTO` | `reopenCount` | `integer` | no | Số lần reopen |
| `TicketDTO` | `closeReason` | `string` | yes | Dùng loại merged ticket khỏi rate/reopen |
| `TicketDTO` | `slaTimer` | `SlaTimerDTO` | yes | Timer snapshot, có thể là lịch sử ở state không countdown |
| `TicketDetailDTO` | `rejectionReason` | `string` | yes | Lý do completion/triage rejection nếu mapper cung cấp đúng |
| `TicketDetailDTO` | `closedAt` | ISO date-time `string` | yes | Soft eligibility 7 ngày |
| `TicketDetailDTO` | `rating` | `integer` | yes | 1–5 khi đã rate |
| `TicketDetailDTO` | `ratedAt` | ISO date-time `string` | yes | Đã rate |
| `TicketDetailDTO` | `escalationReason` | `string` | yes | `SkillGap`, `PartsRequired`, `SafetyConcern`, `SlaBreach`, `CustomerComplaint` |

`SlaTimerDTO` fields cần client giữ đúng type: `id: string`, `priority: TicketPriorityEnum`, `startedAt/dueAt/originalDueAt: string`, `totalPausedMinutes/pauseEpisodesCount: integer`, `warningSentAt/breachAt: string | null`, `status: Running | Paused | Met | Breached | Stopped`, `remainingPercent: number`.

### Commands/endpoints

`{id}` ở path là UUID. Tất cả endpoint yêu cầu JWT; sai/thiếu auth trả 401, sai role trả 403 từ authorization layer.

| Owner / endpoint | JSON/query fields chính xác | Nullability và validation hiệu lực | Success | Handler errors quan sát được |
|---|---|---|---|---|
| Manager web `POST /api/admin/tickets/{id}/assign` | `primaryHandlerStaffId: string(UUID)`; `priority: TicketPriorityEnum` string; `scheduledStartAt: string(DateTimeOffset)`; `supporterStaffIds: string(UUID)[]`; `notes?: string` | Ba field đầu required; array non-null, omission defaults `[]`; `notes` nullable; schedule không cũ hơn current window 5 phút | 200; `Pending` hoặc `InProgress` | 400 validation/past schedule; 403 staff locked/unavailable/tier/transition; 404 ticket/staff |
| Manager web `POST /api/admin/tickets/{id}/schedule` | `scheduledStartAt: string(DateTimeOffset)`; `reason?: string` | schedule required; reason nullable; chỉ `Pending/Scheduled` có Primary | 200; giữ `Pending` hoặc activate `InProgress` | 400 validation/past schedule; 404 ticket; 409 wrong context/no Primary/activation conflict |
| Staff `POST /api/staff/tickets/{id}/hold` | `reason: PauseReasonEnum` string; `note: string`; `rescheduledStartAt: string(DateTimeOffset)` | Tất cả required hiệu lực; reason chỉ `CustomerUnavailable|WorkBlocked`; note trimmed nonblank; appointment strictly future | 200; `Pending/Held` | 400 validation/not-future; 403 not active Primary; 404 ticket; 409 not `InProgress`/SLA not pausable |
| Staff `POST /api/staff/tickets/{id}/resume` | `reason: string` | Wire property nullable nhưng validator yêu cầu trimmed nonblank | 200; `InProgress` | 400 validation; 403 not active Primary; 404 ticket; 409 not `Pending/Held`/activation conflict |
| Staff `POST /api/staff/tickets/{id}/escalate-request` | `reason: EscalationReasonEnum` string; `note: string` | `reason` enum required; command type cho `note` nullable nhưng handler yêu cầu nonblank | 200; `Request` | 400 invalid reason/missing note; 403 not active Primary; 404 ticket; 409 Urgent/wrong transition |
| Manager web `POST /api/admin/tickets/{id}/escalation-decision` | `approve: boolean`; `reason: string`; `keepCurrentPrimary: boolean` | Ba field non-null; reason trimmed nonblank | 200; approve → `ReAssign`, reject → `InProgress` | 400 validation; 404 ticket; 409 not `Request`/transition conflict; auth 401/403 |
| Manager web `POST /api/admin/tickets/{id}/reassign` | `newPrimaryHandlerStaffId: string(UUID)`; `scheduledStartAt: string(DateTimeOffset)`; `reason: string` | Tất cả required; reason nonblank; schedule không cũ hơn current window | 200; future → `Pending/Scheduled`, current → `InProgress` | 400 validation/past schedule; 403 staff locked/unavailable/tier/transition; 404 ticket/staff |
| Staff `POST /api/staff/tickets/{id}/resolve` | `resolutionSummary: string` | Required, trimmed nonblank. Client gọi action này là **Complete**, nhưng giữ route `/resolve` | 200; `Completed` | 400 validation; 403 not eligible Primary/tier/transition; 404 ticket |
| Manager web `POST /api/admin/tickets/{id}/approve?comment={value}` | optional query `comment: string`; **không có JSON body** | comment nullable | 200; `Closed` | 404 ticket; 409 not `Completed`; 403 transition/auth |
| Manager web `POST /api/admin/tickets/{id}/reject` | `reason: string` | Required, trimmed nonblank | 200; `InProgress` | 400 validation; 404 ticket; 403 transition/auth |
| Customer `POST /api/customer/tickets/{id}/rate` | `rating: integer`; `ratingComment?: string` | rating 1..5; comment nullable | 200; vẫn `Closed` | 400 validation; 403 not owner; 404 ticket; 409 wrong/merged/already rated/7-day expiry |
| Customer `POST /api/customer/tickets/{id}/reopen` | `reopenReason: string` | Required, trimmed nonblank | 200; `Open` | 400 validation; 403 not owner/transition; 404 ticket; 409 wrong/merged/rated/7-day expiry |
| Manager web `POST /api/admin/tickets/{id}/triage-reject` | `reason: string` | Required, trimmed nonblank | 200; `ClosedRejected` | 400 validation; 403 transition/auth; 404 ticket |
| Manager web `POST /api/admin/tickets/{id}/declare-incident` | `incidentDescription: string`; `keepCurrentPrimary: boolean` | Description required nonblank; bool non-null | 200; incident/Urgent metadata | 400 validation; 404 ticket; 409 terminal/not eligible; auth 401/403 |

Không dùng các route cũ/không tồn tại: `/start`, `/triage`, force `/escalate`, `/escalate/approve`, `/escalate/reject`.

## Pending và SLA display rules

### Pending

Render branch theo server fields, không suy luận chỉ từ timer:

- `status=Pending`, `pendingContext=Scheduled`: label **Scheduled**, hiển thị `scheduledStartAtUtc`; không hiển thị Hold reason; Staff không có Start/Resume.
- `status=Pending`, `pendingContext=Held`: label **Held**, hiển thị `pendingReason` và `scheduledStartAtUtc`; chỉ active Primary Staff có Early Resume.
- `status=Pending` nhưng `pendingContext=null` hoặc appointment null: render safe fallback “Pending — details unavailable”, telemetry/log development warning, không tự đoán branch.
- Hold note hiện chưa có field trong `TicketDTO`/`TicketDetailDTO`; UI chỉ hiển thị note khi backend bổ sung exact field. Không map nhầm `rejectionReason` thành hold note.

### SLA

Countdown live duy nhất khi:

```text
ticket.status === InProgress
&& ticket.priority !== Urgent
&& ticket.slaTimer?.status === Running
```

- `Pending`, `Request`, `ReAssign`, `Completed`, `Closed`, `ClosedRejected`: không countdown dù DTO còn timer lịch sử.
- `Urgent`: không countdown; render SLA-excluded copy nếu cần.
- `Paused`, `Met`, `Breached`, `Stopped`: render static state, không chạy interval.
- Dùng `remainingPercent` backend cho progress snapshot; không tự dựng denominator sai sau pause/resume.
- `InProgress` vẫn phải refetch vì backend có thể tự động breach và chuyển sang `ReAssign`.

## Freshness, notification, realtime và polling

### Một notification owner

Giữ:

- `src/features/notifications/components/NotificationBootstrap.tsx`
- `src/features/notifications/hooks/useNotificationStream.ts`

Xóa:

- `src/features/notifications/components/NotificationsRealtimeSync.tsx`
- `src/features/notifications/hooks/useNotificationsRealtime.ts`
- Mount/import tương ứng trong `app/_layout.tsx`

`useNotificationStream` là owner duy nhất của `/hubs/notifications`, OS banner, unread count, reconnect và ticket invalidation.

### Authority rules

1. REST ticket/detail/list/dashboard là lifecycle source of truth.
2. Notification invalidation chỉ là **acceleration layer**; event không mutate lifecycle state trực tiếp.
3. Ticket chat SignalR không được dùng làm lifecycle signal.
4. Chỉ invalidate targeted detail khi notification có `entityType === "Ticket"` và UUID `entityId`; đồng thời invalidate ticket list/staff list/activities/dashboard prefixes. Không parse title/body.
5. Event thiếu entity fields vẫn refresh notification feed, nhưng không được coi là bảo đảm ticket freshness; polling fallback tiếp tục.

### Concrete refresh strategy

| Context/state | Refetch rule khi screen/app active |
|---|---|
| Focused detail `Pending/Scheduled` | 30s khi còn xa lịch; 5s trong cửa sổ T-2 phút đến T+2 phút; sau T+2 phút tiếp tục 30s cho tới khi server rời `Pending` |
| Focused detail `Pending/Held` | 30s vì có thể auto-resume theo appointment hoặc external schedule change |
| Focused detail `InProgress` | 15s để bắt automatic SLA breach `InProgress → ReAssign`; countdown local chỉ là display giữa các refetch |
| Focused detail `Request`, `ReAssign`, `Completed` | 30s trong 10 phút đầu, sau đó backoff 60s **không có hard stop** khi state vẫn chờ external Manager action |
| Customer/Staff lists | 60s khi dữ liệu có `Pending/InProgress/Request/ReAssign/Completed`; dừng interval khi screen blur/background nhưng refetch ngay lúc focus/foreground |
| Staff dashboard stats | 60s khi dashboard focused; notification/mutation invalidation có thể refetch sớm hơn |
| Foreground | Một lần invalidate active ticket details, customer/staff lists, activities, staff dashboard và notifications |
| Notification hub reconnected | Một lần invalidate cùng lifecycle query prefixes để bù missed events |
| Mutation success | Invalidate exact detail + activities + customer/staff list + dashboard; action response không thay full cache |

Polling không chạy trong background. Khi app trở lại active, refetch ngay rồi tái lập cadence theo state mới. Nếu cần bắt HTTP connectivity recovery độc lập với SignalR, Phase 4 sẽ wire TanStack `onlineManager` bằng `@react-native-community/netinfo`; đây là dependency addition phải được xác nhận trong Phase 0.

## Implementation phases

### Phase 0 — Contract freeze và implementation gate

1. Backend xác nhận/bổ sung các gap ở mục “Open backend/API decisions”.
2. Chốt TypeScript wire types từ exact JSON contract, không từ stale doc prose.
3. Chốt test runner và NetInfo dependency nếu dùng.
4. User đổi plan thành `APPROVED_FOR_IMPLEMENTATION`.

Definition of Done:

- Mọi endpoint/DTO client sử dụng có field, type, nullability, enum serialization, success/error status được ghi và backend owner xác nhận.
- Không còn route ambiguity cho escalation/schedule/hold.
- Manager web-only được giữ trong scope và không có mobile Manager deliverable.
- Chưa sửa source trước user approval.

### Phase 1 — Canonical types và workflow utilities

1. Thay `TicketStatusEnum` bằng đúng 8 status; thêm `Urgent`, `PendingContextEnum`, `PauseReasonEnum`, `SlaTimerStatusEnum.Stopped`, enum escalation thực tế.
2. Sửa `TicketDTO`, `TicketDetailDTO`, `TicketActionDTO`, assignment role `PreviousPrimaryHandler` theo wire contract.
3. Tạo `ticketWorkflow.ts` cho status groups/action guards/SLA predicate/rate-reopen soft eligibility.
4. Tạo `ticketLabels.ts` cho label/badge/pending secondary/progress phase.
5. Không để screen/card tự định nghĩa status groups riêng.

Definition of Done:

- Typecheck qua; enum serialize bằng string canonical.
- Unit table covers đủ 8 status, Pending branch, Urgent SLA và action guards Customer/Staff.
- `rg` status dependency cũ có kết quả 0 sau whitelist domain/action hợp lệ được review (“no-legacy-status scan”).

### Phase 2 — Services, commands, validation và mutation invalidation

1. Xóa `/start` endpoint/service/hook/caller.
2. Hold gửi `reason`, required trimmed `note`, `rescheduledStartAt`; appointment strictly future.
3. Resume gửi required trimmed `reason`.
4. Escalate request dùng enum thật và required note theo handler.
5. Giữ URL `/resolve`, đổi client semantic/component/hook thành Complete và expect `Completed`.
6. Rating/reopen guard theo eligible `Closed`; handle 400/403/404/409 theo contract.
7. Mọi mutation invalidate shared lifecycle query set.

Definition of Done:

- Request serialization tests khớp exact field name/casing/nullability/time offset.
- Không còn `/start` trong `app/`/`src/`.
- Error UI phân biệt validation, permission/not-owner, not-found và stale/state/expiry conflict.
- Mutation success không để list/detail/dashboard cache stale.

### Phase 3 — Customer/Staff workflow UI

1. Badge/card/detail render đủ 8 status và Urgent.
2. Tạo shared `PendingContextCard`: Scheduled/Held + reason + appointment; hold note chỉ thêm khi contract có field.
3. Staff action bar: Hold, Early Resume, Escalation, Complete đúng status, priority và Primary role; không Start.
4. Customer detail: Completed/Closed/ClosedRejected, rating/reopen và reason copy đúng.
5. Bubble Chat dùng cùng workflow utilities/components với detail screens, không duy trì duplicate guard.
6. Maintenance/chat permissions dùng terminal states thật; không giả `Completed` là legacy terminal.
7. Schedule picker hiển thị local timezone, confirmation có timezone/offset, request dùng `toISOString()`.

Definition of Done:

- Customer/Staff role matrix có component tests cho allowed/hidden action.
- Pending luôn có branch label an toàn; missing contract field không làm crash.
- SLA countdown chỉ xuất hiện theo invariant GH-1176.
- Accessibility labels/copy/timezone được review.

### Phase 4 — Notification owner và lifecycle freshness

1. Giữ `NotificationBootstrap` + `useNotificationStream`; xóa owner trùng.
2. Targeted invalidation từ `entityType/entityId`; notification chỉ acceleration.
3. Thêm state-aware polling/detail schedule-aware refetch, list/dashboard polling và foreground/reconnect invalidation.
4. Không dùng chat SignalR cho lifecycle.
5. Bảo đảm `InProgress → ReAssign` do breach xuất hiện không cần manual refresh.

Definition of Done:

- Root chỉ mở một `/hubs/notifications` connection.
- Tests chứng minh Ticket notification invalidates đúng keys, non-Ticket notification không refetch ticket.
- Request/ReAssign/Completed vẫn refresh sau 10 phút nếu state chưa đổi.
- Foreground/reconnect và missed scheduled activation/breach đều tự reconcile bằng REST.

### Phase 5 — Filters, dashboard và cross-screen consistency

1. Customer tabs/profile dùng canonical active/closed groups.
2. Staff dashboard/customer lists/cards dùng 8 status, Urgent và server stats.
3. `useTickets.ts`, `useStaffTickets.ts`, `useStaffDashboardStats.ts` sở hữu/reflected polling behavior nêu trên.
4. `countByStatus` tolerant với missing keys trong rollout nhưng UI chỉ hiển thị 8 canonical keys.
5. Không thêm Manager reports/screens vào mobile.

Definition of Done:

- Cùng ticket có badge/label/group nhất quán ở list, detail, dashboard và Bubble Chat.
- Filter request không gửi status legacy.
- Dashboard không tự tính KPI từ status legacy hoặc một page list bị cap.

### Phase 6 — Verification và cleanup

1. Chạy no-legacy-status scan và route scan.
2. TypeScript check, Expo lint, Android/iOS smoke.
3. Chạy unit/component/integration/e2e matrix.
4. Review API fixtures cho camelCase, string enums, null/omitted fields và timezone boundaries.

Definition of Done:

- Không còn unwhitelisted legacy status hoặc `/start` dependency trong `app/`/`src/`.
- Tất cả acceptance criteria trong traceability table pass.
- Không có Manager mobile route/service/action.
- Test evidence được lưu trong `logs/GH-1176/` trước handoff.

## File impact

### Types, endpoints, query keys và services

- `src/shared/enums/ticket.enum.ts`
- `src/features/tickets/types/ticket.types.ts`
- `src/features/staff/types/staff.types.ts`
- `src/lib/endpoints.ts`
- `src/lib/queryKeys.ts`
- `src/features/tickets/services/ticket.service.ts`
- `src/features/staff/services/staffTicket.service.ts`
- `src/features/tickets/services/ticketChatActions.service.ts`

### Query/mutation hooks

- `src/features/tickets/hooks/useTickets.ts`
- `src/features/tickets/hooks/useTicketDetail.ts`
- `src/features/staff/hooks/useStaffTickets.ts`
- `src/features/staff/hooks/useStaffTicketDetail.ts`
- `src/features/staff/hooks/useStaffDashboardStats.ts`
- `src/features/staff/hooks/useHoldTicket.ts`
- `src/features/staff/hooks/useResumeTicket.ts`
- `src/features/staff/hooks/useEscalateTicket.ts`
- `src/features/staff/hooks/useResolveTicket.ts` → rename/new `useCompleteTicket.ts`
- `src/features/tickets/hooks/useRateTicket.ts`
- `src/features/tickets/hooks/useReopenTicket.ts`
- Delete `src/features/staff/hooks/useStartTicket.ts`

### UI/screens/routes

- `src/features/tickets/components/TicketStatusBadge.tsx`
- `src/features/tickets/components/SlaCountdown.tsx`
- `src/features/tickets/components/TicketCard.tsx`
- `src/features/staff/components/StaffTicketCard.tsx`
- `src/features/staff/components/TicketActionBar.tsx`
- `src/features/staff/components/HoldModal.tsx`
- `src/features/staff/components/EscalateModal.tsx`
- `src/features/staff/components/ResolveModal.tsx` → rename/new `CompleteTicketModal.tsx`
- `src/features/tickets/components/ReopenModal.tsx`
- `src/features/tickets/components/RateModal.tsx`
- `src/features/tickets/components/ActivityTimeline.tsx`
- `src/features/tickets/utils/activityMeta.ts`
- `src/features/tickets/screens/CustomerTicketDetailScreen.tsx`
- `src/features/staff/screens/StaffTicketDetailScreen.tsx`
- `src/features/notifications/components/BubbleChatRoot.tsx`
- `app/(customer)/(tabs)/tickets.tsx`
- `app/(customer)/(tabs)/profile.tsx`
- `app/(staff)/(tabs)/dashboard.tsx`
- `src/features/staff/components/StaffDashboardStats.tsx`
- `app/(staff)/(tabs)/customers.tsx`
- `app/(staff)/customers/[customerId].tsx`

### Notification/freshness owner

- Keep and modify `src/features/notifications/components/NotificationBootstrap.tsx`
- Keep and modify `src/features/notifications/hooks/useNotificationStream.ts`
- Delete `src/features/notifications/components/NotificationsRealtimeSync.tsx`
- Delete `src/features/notifications/hooks/useNotificationsRealtime.ts`
- Modify `app/_layout.tsx`
- Possibly modify `package.json` only if Phase 0 approves NetInfo/test dependencies

### Planned new shared files

- `src/features/tickets/utils/ticketWorkflow.ts`
- `src/features/tickets/utils/ticketLabels.ts`
- `src/features/tickets/utils/scheduleTime.ts`
- `src/features/tickets/components/PendingContextCard.tsx`
- `src/features/staff/components/EarlyResumeModal.tsx`
- Schemas for hold, early resume and reopen if existing validation placement cannot host them cleanly
- Test files/config after test stack is approved

Không có Manager mobile files trong impact.

## Traceability — tám yêu cầu ban đầu

| # | Requirement | Phase | Primary files | Acceptance criteria |
|---:|---|---|---|---|
| 1 | Mapping 8 TicketStatusEnum mới | 1, 6 | enum/types, workflow utilities, badges | Exact names/values documented; REST string enum; 8-status tests pass |
| 2 | Xóa status cũ | 1, 2, 3, 5, 6 | toàn `app/`, `src/`, endpoint/service/hook | `rg` zero unwhitelisted dependencies; `/start` removed |
| 3 | UI role Customer/Staff/Manager flows | 0, 2, 3 | detail/action/modal/Bubble Chat; Manager external fixtures | Customer/Staff actions đúng matrix; Manager web-only; Manager-created states render đúng |
| 4 | SLA chỉ countdown InProgress non-Urgent | 1, 3, 4 | `SlaCountdown`, workflow predicate, detail/Bubble Chat | Forbidden states/priority never tick; breach refetch reaches ReAssign |
| 5 | Pending Scheduled/Held + reason/schedule | 0, 1, 3 | DTO types, `PendingContextCard`, detail/cards | Branch đúng API; reason + appointment shown; missing hold note flagged as contract gap |
| 6 | Notification/realtime/polling/timezone | 2, 3, 4 | notification owner, three query hooks, schedule utility/forms | One hub owner; acceleration-only; indefinite waiting-state refresh; timezone boundaries pass |
| 7 | Endpoint/DTO/enum/badge/filter/dashboard/report impact | 0–6 | file impact above | Exact contract table complete; canonical filter/dashboard; no Manager report scope |
| 8 | Nêu API/backend gaps | 0 | open decisions below | Backend/user decisions recorded before implementation approval |

## Test plan

### Unit

- Exact enum/string serialization for 8 statuses, PendingContext, PauseReason, EscalationReason, SlaTimerStatus and Urgent.
- `ticketWorkflow`: Customer/Staff action table, terminal/active groups, Primary/Supporter/PreviousPrimary behavior.
- SLA predicate: every status × priority × timer status; only non-Urgent InProgress Running returns live.
- Pending label/card view-model: Scheduled, Held, null context, missing reason/date.
- Rating/reopen soft eligibility: owner, non-merged, Closed, unrated, 7-day boundaries.
- Schedule conversion: Asia/Bangkok, UTC, negative offset, midnight/date rollover, invalid date; assignment boundaries `now-5m`, `now`, future; hold `now` invalid and future valid.
- Query invalidation: Ticket entity targets detail/list/activity/dashboard; non-Ticket does not; missing entity fields falls back to polling only.
- Refetch interval: InProgress breach path, schedule-aware window, Request/ReAssign/Completed after 10 minutes.

### Component/UI

- Badge renders all 8 statuses + unknown fallback; Urgent never falls back to P3.
- `PendingContextCard` shows Scheduled/Held, reason and local appointment with timezone.
- Staff action bar has no Start; Hold/Early Resume/Escalate/Complete visibility and disabled reasons match matrix.
- Hold requires reason/note/future time and serializes `rescheduledStartAt`; resume requires reason.
- Request/ReAssign/Completed explanations render for Customer and Staff.
- Closed Customer actions: Rate/Reopen eligibility; rating keeps Closed; ClosedRejected/merged/rated/expired have no invalid action.
- Detail and Bubble Chat consume same workflow behavior.
- SLA static/live rendering matches invariant and accessibility copy.

### Integration/e2e

1. Current assignment: `Open → InProgress`; countdown only non-Urgent.
2. Future assignment: `Open → Pending/Scheduled`; appointment shown, no Start/countdown; activation refetched to InProgress.
3. Hold: `InProgress → Pending/Held`; reason/appointment shown, SLA static.
4. Early resume by Primary: `Pending/Held → InProgress`; Supporter/Previous Primary cannot act.
5. Escalation request: `InProgress → Request`; Manager web reject returns InProgress; approve returns ReAssign.
6. Automatic SLA breach: screen left open at InProgress refetches to ReAssign without notification/chat/manual refresh.
7. Reassign current/future: mobile receives InProgress or Pending/Scheduled and updates assignee/actions.
8. Complete: `InProgress → Completed`; Manager web approve → Closed; reject → InProgress.
9. Rate eligible Closed: status stays Closed and rating appears.
10. Reopen eligible Closed: same ticket returns Open; stale/race 409 is reconciled by refetch.
11. ClosedRejected and merged Closed never offer rating/reopen.
12. Waiting-state screen remains open longer than 10 minutes and still detects external action.
13. Missed notification/reconnect/foreground reconciles detail/list/dashboard by REST.
14. Notification without Ticket entity data does not falsely mutate lifecycle.
15. Local schedule across UTC date boundary round-trips to same instant after backend refetch.

Repository hiện chưa có test runner/scripts cho unit/component/e2e. Phase 0 phải chọn stack và CI command; không được tuyên bố các test này đã chạy.

## Open backend/API decisions before implementation

1. **Hold note exposure — blocking for full requirement 5.** `TicketDTO`/`TicketDetailDTO` có `pendingReason` và appointment nhưng không có current hold note/reason text field. Backend cần bổ sung exact JSON field hoặc user chấp nhận mobile chỉ hiện enum reason + schedule.
2. **Machine-readable errors — contract gap.** Handler chỉ trả HTTP status + human `message`; UI không thể ổn định phân biệt stale state, expiry, wrong Primary, schedule invalid bằng error code. Backend cần cung cấp error `code`, hoặc user chấp nhận status/message fallback.
3. **Notification workflow contract.** `NotificationDTO` có nullable `entityType`, `entityId`, `payloadJson`, nhưng docs chưa guarantee mọi GH-1176 notification có `entityType="Ticket"`, ticket UUID, event ordering và delivery semantics. Polling không phụ thuộc gap này, nhưng targeted acceleration cần guarantee.
4. **Rating/reopen eligibility.** Detail chưa có `canRate`, `canReopen`, `ratingDeadline/graceExpiresAt`, server time hay non-eligibility reason. Client chỉ soft-gate từ `closedAt/rating/closeReason`; server 409 là authoritative. Backend/user cần chấp nhận hoặc bổ sung fields.
5. **Dashboard/report semantics.** Backend DTO comments/API doc còn status cũ (`Resolved`, `ClosedPendingRate`, 14 keys). Cần xác nhận `openCount`, `resolvedCount`, `slaMonitoredCount`, `countByStatus` theo 8 status và Urgent exclusion. Mobile không implement Manager reports, nhưng Staff dashboard contract vẫn cần sửa/chốt.
6. **Date-time response precision.** Commands dùng `DateTimeOffset`, nhưng `TicketDTO.scheduledStartAtUtc` là nullable `DateTime`. Backend cần guarantee output có UTC `Z` (không local/unspecified) để client parse không lệch timezone.
7. **Escalation note nullability drift.** Command type khai `note` nullable, handler lại trả 400 nếu blank. Contract nên đổi schema/doc thành required để generated clients không sai.
8. **Controller/OpenAPI drift.** Một số `[ProducesResponseType]`/comments chưa liệt kê 400/404/409 mà handler thực trả; completion route vẫn tên `/resolve`; approve dùng query `comment`. Backend cần cập nhật OpenAPI/doc để contract table không chỉ phụ thuộc source inspection.
9. **Connectivity owner choice.** Nếu cần immediate HTTP reconnect ngoài SignalR reconnect/AppState, approve thêm `@react-native-community/netinfo` và TanStack `onlineManager`; nếu không, chấp nhận polling/foreground là fallback.

## Risks

- High: mixed deployment có thể trả legacy status cho canonical-only client.
- High: stale OpenAPI/comments có thể khiến request field/route bị implement sai.
- High: missing hold note contract làm requirement Pending/Held chưa đầy đủ.
- Medium: notification thiếu Ticket entity metadata làm invalidation phải dựa nhiều hơn vào polling.
- Medium: clock skew/timezone khiến client soft validation khác server; server response luôn authoritative.
- Medium: rating/reopen 7-day race không thể giải quyết hoàn toàn bằng local guard.
- Medium: duplicate workflow logic giữa detail/Bubble Chat/dashboard dễ drift nếu không centralize.
- Medium: polling cadence ảnh hưởng battery/network; chỉ poll khi active/focused và backoff nhưng không hard-stop waiting states.
- Medium: chưa có test runner/CI nên Phase 0 cần dependency/config decision.

## Approval gate

Plan đang **REVIEWING**, `User Decision: PENDING`.

Không Phase implementation nào được bắt đầu và không source file nào được sửa cho tới khi user ghi rõ **APPROVED** và plan được chuyển thành `APPROVED_FOR_IMPLEMENTATION`. Các open backend/API decision ở trên phải được user/backend chốt hoặc có documented deviation trước khi code phần phụ thuộc.
