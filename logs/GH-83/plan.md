# Plan — GH-83: Notification preferences matrix + categories + mark push opened

## Metadata
- **Status:** REVIEWING | **Role:** Mobile | **Ngày:** 2026-08-01 · **Cập nhật lần cuối:** 2026-08-01
- **Issue:** #83 — https://github.com/GSU26SE55/mobile/issues/83
- **Sprint:** Sprint 6 (due 2026-08-08) | **Priority:** P2: High (24h)
- **Repo phụ:** `GSU26SE55/backend` — sửa trực tiếp, **không tạo issue** (user chốt)

## Mục tiêu
Wire 5 endpoint Sprint 6.3 còn thiếu cho mobile, trọng tâm là màn **"Cài đặt thông báo"** dạng ma
trận nhóm × kênh. Kèm sửa 1 lỗi mất dữ liệu đang chạy trong code #43 và 2 lỗi BE phát hiện khi verify.

---

## Verify đã làm (không phải giả định)

Chạy `make docker-up` (27 container Up), login token **Customer** thật (`ttei8191@gmail.com`), gọi API
qua gateway `:4001`:

| Kiểm chứng | Kết quả |
|---|---|
| `GET /matrix` | 200 · `channels` **11 field** · `categories` đúng 6 nhóm · `isCustomized=false` |
| `GET /categories` | 32 mục · `typeValues` thiếu **25, 26** · giá trị **27 chỉ trả `ChatEscalatedToAdmin`** |
| PUT shape mobile (7 field) | **Reset** `notifyOnChat/Mention/Reaction` + `digestWindowMinutes` về default |
| Unit test BE `EveryNotificationType_HasExplicitCategory` | **FAIL sẵn trên `dev`** — chạy 2 lần qua container, `REAL_EXIT=1`, `Failed: 1, Passed: 9, Total: 10`, `missing = {BlogGenerationCompleted:25, BlogGenerationFailed:26}` |
| `SELECT type,COUNT(*) FROM notifications` | Không có record `type=27` → đổi giá trị enum an toàn |

> Máy không có .NET SDK — chạy test BE qua `docker run --rm -v "$PWD":/src -w /src
> mcr.microsoft.com/dotnet/sdk:8.0 dotnet test ...`. **Không** pipe qua `tail` (nuốt exit code).

**Backend đang ở đúng `dev`** (phản bác nghi vấn "verify trên branch cũ"):
```
branch = dev | HEAD = f0621bf1 (2026-07-31) | working tree SẠCH
5fe66795 (refactor notification delivery)  ancestor-of-HEAD: YES
2e401cb3 (grpc audio-to-text + merged ticket noti)  ancestor-of-HEAD: YES
```
Stack dựng bằng `up -d --build` từ chính cây này → kết quả API ở trên là của `dev` hiện tại.

### Baseline quality gate mobile (đo 2026-08-01, trước khi code)

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | **PASS** — nhưng chỉ sau khi chạy `npm install` |
| `npm run lint` (`expo lint`) | **69 problems = 1 error + 68 warnings** |

- Máy chưa `npm install` sau khi pull commit stepper (GH-693) → `@react-native-community/datetimepicker`
  có trong `package.json:16` nhưng thiếu ở `node_modules`, làm `tsc` đỏ. Cài xong là hết, `package-lock.json` **không đổi**.
- 1 error còn lại: `import/no-unresolved` cho `datetimepicker` tại `CreateTicketStepper.tsx:19` —
  **chỉ xuất hiện qua `expo lint`**; chạy `npx eslint <file> --no-cache` trực tiếp thì sạch.
  Là quirk resolver của `expo lint`, không phải lỗi code. **Tồn tại sẵn trên `dev`, không do ticket này.**
- 68 warning phần lớn là `no-redeclare` do chính pattern `as const` mà rules bắt buộc → không sửa trong ticket feature.

---

## Scope

**Trong scope — Mobile:**
- `GET`/`PUT /notification-preferences/matrix` + `GET /notification-preferences/categories`
- `PATCH /notifications/{id}/opened` + push response listener (tối thiểu: tap → `/opened` → deep-link, kèm cold-start)
- `POST /tickets/{tid}/chats/{cid}/voice/retry` + badge `Failed` + nút "Thử lại" trong chat
- **Fix mất dữ liệu:** `NotificationPreferenceDto` 7 → 11 field, hiện 3 toggle chat trên UI
- **Sync enum:** `NotificationStatusEnum` thêm `Delivered:5`/`Opened:6`; sửa `isUnread`;
  `NotificationTypeEnum` bổ sung **16 giá trị**: 19–33 (15) **+ `TicketMerged:34`** + `ICON_MAP`

> ⚠️ **34, không phải 27.** Bản plan trước ghi "19–33" là **thiếu** — phần BE đổi `TicketMerged`
> sang 34, nên mobile phải khai 34 mới khớp. Nếu chỉ thêm 19–33 thì notification `TicketMerged`
> rơi vào `FALLBACK_ICON` và không map được nhóm.

**Trong scope — Backend** (sửa thẳng, branch riêng, không issue):

> ⚠️ **Phần BE này VƯỢT scope gốc của issue #83** (issue chỉ yêu cầu wire 5 endpoint cho mobile).
> Đây là quyết định có chủ đích của user ("thực hiện luôn trên repo backend" + "sửa luôn cả 2"),
> không phải scope creep. Phải ghi rõ trong issue body khi post plan để reviewer nắm.

- `ExpoPushChannel` — **sửa logic đã có, không thêm mới**:
  - `SendAsync` hiện dựng `data` **chỉ** từ `PayloadJson` (`:66-77`) → đổi thành merge thêm `notificationId`
  - `FitWithinSizeLimit` **đã có sẵn** cơ chế degrade (`:179-210`), hiện đặt `data = null` khi quá 4KB
    (`:192`) → đổi thành hạ xuống bản tối thiểu `{ notificationId }` (36 byte, luôn vừa trần)
- `NotificationCategoryMap`: thêm `BlogGenerationCompleted:25`, `BlogGenerationFailed:26` → nhóm `Account`
- `NotificationTypeEnum`: `TicketMerged` 27 → **34** (bỏ trùng với `ChatEscalatedToAdmin`), khai báo nhóm `Ticket`
- Unit test cho 2 hành vi push mới + 1 test chặn trùng giá trị enum

**Ngoài scope:**
- ❌ Receive pipeline đầy đủ (`setNotificationHandler` banner foreground, badge count) — mobile.md ghi là scope riêng
- ❌ Màn Frequency/digest (BE chưa có UI tương ứng) — `digestWindowMinutes` chỉ pass-through
- ❌ `/api/admin/notification-templates` — mobile không có role Admin
- ❌ Sửa `NotificationStatusEnum` phía web (đã đúng sẵn)

---

## Enums

| Enum | File | Action |
|---|---|---|
| `NotificationStatusEnum` | `src/features/notifications/enums/notification.enum.ts` | modify — thêm `Delivered:5`, `Opened:6` |
| `NotificationTypeEnum` | (nt) | modify — thêm **16 giá trị**: 19–33 + `TicketMerged: 34` |
| `NotificationCategoryEnum` | (nt) | **create** — `Ticket:1 … Account:6` |
| `VoiceTranscriptionStatusEnum` | `src/features/tickets/enums/chat.enum.ts` | **create** — `Pending/Processing/Completed/Failed`, BE gửi **CHUỖI** (TicketService có `JsonStringEnumConverter`) |

> ⚠️ `NotificationTypeEnum` mobile hiện có `CascadeRiskHigh:15`, `BatteryAlertEscalationPending:16` —
> **đúng rồi, không đụng vào** (xem memory `gh74-enum-split-and-aggregate-hourly`).

## Types

```ts
// notification-preference.types.ts — MỞ RỘNG 7 → 11 field
interface NotificationPreferenceDto {
  pushEnabled, emailEnabled, smsEnabled, inAppEnabled: boolean;
  quietHoursStart, quietHoursEnd: string | null;   // "HH:mm"
  timeZone: string;
  notifyOnChat, notifyOnMention, notifyOnReaction: boolean;  // ← MỚI
  digestWindowMinutes: number | null;                        // ← MỚI
}

// notification-matrix.types.ts — MỚI (shape khớp web frontend đã có)
interface NotificationCategoryPreferenceDto {
  category: NotificationCategoryEnum; categoryName: string;
  pushEnabled, emailEnabled, smsEnabled, inAppEnabled, isCustomized: boolean;
}
interface NotificationPreferenceMatrixDto {
  channels: NotificationPreferenceDto;
  categories: NotificationCategoryPreferenceDto[];   // luôn đúng 6
}
interface UpdateNotificationMatrixPayload { items: NotificationCategoryPreferenceItem[] }
interface NotificationCategoryMapDto { type, category: string; typeValue, categoryValue: number }
```

## Endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/notification-preferences/matrix` | — | `CommonResponse<NotificationPreferenceMatrixDto>` |
| PUT | `/api/notification-preferences/matrix` | `{ items: [...] }` — **vá từng dòng**, mỗi dòng đủ 4 kênh | ma trận đầy đủ sau update |
| GET | `/api/notification-preferences/categories` | — | `CommonResponse<NotificationCategoryMapDto[]>` |
| PUT | `/api/notification-preferences` | **đủ 11 field** | `CommonResponse<NotificationPreferenceDto>` |
| PATCH | `/api/notifications/{id}/opened` | không body | `CommonResponse<Guid>` — idempotent, 404 nếu khác chủ |
| POST | `/api/tickets/{tid}/chats/{cid}/voice/retry` | không body | **202** · 409 nếu chưa `Failed` · 404 nếu chat khác ticket |

> Enum trong NotificationService serialize **INT** (`AddControllers()` không gắn
> `JsonStringEnumConverter`) → `category` gửi/nhận số. Khác TicketService (gửi chuỗi).

## Files

**Mobile**

| File | Action | Ghi chú |
|---|---|---|
| `src/features/notifications/enums/notification.enum.ts` | modify | +`Delivered/Opened`, +16 type (19–33 + `TicketMerged:34`), +`NotificationCategoryEnum` |
| `src/features/notifications/types/notification.types.ts` | modify | `isUnread` loại cả `Opened` |
| `src/features/notifications/types/notification-preference.types.ts` | modify | 7 → 11 field |
| `src/features/notifications/types/notification-matrix.types.ts` | create | |
| `src/features/notifications/services/notification-matrix.service.ts` | create | |
| `src/features/notifications/services/notification.service.ts` | modify | +`markOpened` |
| `src/features/notifications/hooks/useNotificationMatrix.ts` | create | query + mutation vá dòng |
| `src/features/notifications/hooks/useNotifications.ts` | modify | +`useMarkNotificationOpened` |
| `src/features/notifications/components/NotificationPreferencesForm.tsx` | modify | nguồn = `/matrix`; +3 toggle chat; pass-through digest |
| `src/features/notifications/components/CategoryMatrixTable.tsx` | create | bảng 6 nhóm × 4 kênh |
| `src/features/notifications/components/NotificationCard.tsx` | modify | `ICON_MAP` cho 16 type mới (bảng bên dưới) |
| `src/features/notifications/components/NotificationList.tsx` | modify | deep-link → `/opened`, còn lại `/read` |
| `src/lib/endpoints.ts` | modify | +`MATRIX`, `CATEGORIES`, `OPENED`, `CHAT_VOICE_RETRY` |
| `src/lib/queryKeys.ts` | modify | +`notificationPreferences.matrix()`, `.categories()` |
| `src/lib/push.ts` | modify | +`registerResponseListener`, +cold-start |
| `app/_layout.tsx` | modify | gắn listener 1 lần ở root |
| `src/features/tickets/enums/chat.enum.ts` | create | `VoiceTranscriptionStatusEnum` |
| `src/features/tickets/types/ticket.types.ts` | modify | +`voiceTranscriptionStatus` vào chat DTO |
| `src/features/tickets/services/ticketChatActions.service.ts` | modify | +`retryVoice` |
| `src/features/tickets/hooks/useTicketChatActions.ts` | modify | +`useRetryVoiceChat` (202 → invalidate) |
| `src/features/tickets/components/VoiceMessageBubble.tsx` | modify | badge `Failed` + nút "Thử lại" |

**Backend** — branch `fix/notification-push-payload-and-enum`

| File | Action | Ghi chú |
|---|---|---|
| `.../Infrastructure/Channels/ExpoPushChannel.cs` | modify | merge `notificationId` vào `data`; degrade thay vì `data=null` |
| `.../Domain/Enums/NotificationTypeEnum.cs` | modify | `TicketMerged` 27 → 34 |
| `.../Domain/Enums/NotificationCategoryMap.cs` | modify | +Blog 25/26 → `Account`; +`TicketMerged` → `Ticket` |
| `.../tests/.../Channels/ExpoPushPayloadLimitTests.cs` | modify | +2 test payload |
| `.../tests/.../Handlers/Preference/CategoryPreferenceTests.cs` | modify | +test chặn trùng giá trị enum |

---

## ICON_MAP — 16 type mới (Ionicons, dùng token màu sẵn có trong `lib/theme`)

| Type | Icon | Màu |
|---|---|---|
| `ChatCreated:19` | `chatbubble-outline` | `info` |
| `ChatMentioned:20` | `at-outline` | `primary` |
| `ChatReacted:21` | `heart-outline` | `stProgress` |
| `ParticipantAdded:22` | `person-add-outline` | `success` |
| `ParticipantRemoved:23` | `person-remove-outline` | `textMute` |
| `ParticipantRoleChanged:24` | `swap-horizontal-outline` | `info` |
| `BlogGenerationCompleted:25` | `document-text-outline` | `success` |
| `BlogGenerationFailed:26` | `document-outline` | `danger` |
| `ChatEscalatedToAdmin:27` | `arrow-up-circle-outline` | `stEscalated` |
| `TicketApproved:28` | `checkmark-circle-outline` | `success` |
| `TicketRejected:29` | `close-circle-outline` | `danger` |
| `TicketReopened:30` | `refresh-outline` | `warning` |
| `TicketRatingRequested:31` | `star-outline` | `warning` |
| `BatteryAnomalyWarning:32` | `battery-half-outline` | `warning` |
| `BatteryAnomalyInfo:33` | `battery-full-outline` | `info` |
| **`TicketMerged:34`** | `git-merge-outline` | `info` |

> Giữ nguyên `FALLBACK_ICON` — sau này BE thêm type mới mà mobile chưa kịp sync thì vẫn có icon,
> không vỡ UI.

## Approach

**Màn cài đặt — 1 request, 2 mutation:**
```
mount → GET /matrix (nguồn DUY NHẤT, bỏ GET base)
   ├── channels   → form công tắc toàn cục  → PUT /notification-preferences  (đủ 11 field)
   └── categories → bảng 6 nhóm × 4 kênh    → PUT /matrix { items: [dòng vừa đổi] }
```
Chỉ gửi **dòng người dùng vừa đổi** — không gửi cả 6. Response PUT trả ma trận đầy đủ →
`setQueryData`, không refetch.

**Push tap:**
```
BE: data = { notificationId, ...PayloadJson }   ← luôn có notificationId, kể cả khi cắt 4KB
mobile: response listener → data.notificationId? → PATCH /opened → deep-link theo ticketId/chatId
        (thiếu notificationId → bỏ qua, KHÔNG crash — BE cũ vẫn chạy được)
```

**Feed in-app:** theo đúng logic web (`NotificationBell.tsx:51-68`) — có deep-link mới gọi `/opened`,
click thường chỉ `/read`, để open rate không bị loãng.

**Voice retry:** bubble `Failed` → nút "Thử lại" → POST → **202** (BE xử lý bất đồng bộ) →
invalidate chat list để thấy trạng thái đổi.

---

## Edge Cases
- `PUT /matrix` gửi trùng `category` → BE 400 `"Nhóm '{tên}' xuất hiện nhiều lần"` → map vào toast
- Dòng nhóm phải gửi **đủ 4 kênh** — thiếu field ⇒ BE ghi `false`, không giữ giá trị cũ
- `isCustomized=false` → hiển thị nhãn "kế thừa"; user chạm 1 ô ⇒ dòng đó thành đã đặt
- Công tắc toàn cục **luôn thắng** dòng nhóm → tắt Push toàn cục thì cả cột Push của bảng phải mờ đi
- `/opened` idempotent — gọi lại khi mạng chập chờn vẫn 200; notification của user khác → 404
- Push cũ (BE chưa deploy) không có `notificationId` → listener chỉ deep-link, không gọi `/opened`
- Cold-start: app tắt hẳn, bấm push → `getLastNotificationResponseAsync`, thiếu thì mất sự kiện
- `voice/retry` chat chưa `Failed` → **409**, không phải lỗi hệ thống → toast nhẹ, không đỏ
- Quiet hours: giữ nguyên logic #43 (Zod `HH:mm`, qua đêm 22:00–07:00 hợp lệ)

## Acceptance Criteria
- [ ] Màn cài đặt load 1 request `/matrix`, hiện 6 nhóm × 4 kênh + nhãn "kế thừa" đúng `isCustomized`
- [ ] Đổi 1 ô → `PUT /matrix` chỉ chứa **dòng đó**; các nhóm khác giữ nguyên (verify bằng GET lại)
- [ ] **Lưu công tắc toàn cục KHÔNG còn reset** `notifyOnChat/Mention/Reaction/digestWindowMinutes`
      (lặp lại thí nghiệm B1→B3, giá trị phải giữ)
- [ ] 3 toggle chat hiển thị và lưu được từ mobile
- [ ] Notification đã `Opened` **không** còn hiện "chưa đọc"; badge khớp danh sách
- [ ] Bấm push (BE mới) → gọi `/opened` + điều hướng đúng; push cũ thiếu id → chỉ điều hướng, không crash
- [ ] Chat voice `Failed` hiện badge + nút "Thử lại" → 202 → trạng thái cập nhật
- [ ] BE: `GET /categories` trả **35 mục** (32 hiện tại + Blog 25/26 + `TicketMerged` = 35), có `TicketMerged` (nhóm `Ticket`) và Blog 25/26
- [ ] BE: `dotnet test` NotificationService **xanh** (test `EveryNotificationType_HasExplicitCategory` hết đỏ)
- [ ] Mobile: `npx tsc --noEmit` PASS; `npm run lint` **không tăng** so với baseline `dev`
      **đã đo 2026-08-01: 69 problems = 1 error + 68 warnings** (xem mục Baseline bên dưới)

## Steps
- [x] B1 — BE: `ExpoPushChannel` chèn `notificationId` + degrade khi cắt 4KB, +2 unit test — 2026-08-01
      (3 test mới + sửa `OversizedData_*` cho khớp hành vi mới; `ExpoPushPayloadLimitTests` **10/10 pass**)
- [x] B2 — BE: **đổi `TicketMerged` 27→34 TRƯỚC**, rồi mới map +Blog 25/26 +TicketMerged, +test chặn trùng giá trị enum — 2026-08-01
      (`NotificationCategoryMapTests` **11/11 pass**; `EveryNotificationType_HasExplicitCategory` đỏ → xanh;
      thêm `NotificationTypeEnum_HasNoDuplicateValues` bịt đúng lỗ hổng đã cho lỗi lọt CI)

> ⚠️ **Thứ tự B2 bắt buộc — không đảo được.** `Map` là `Dictionary<NotificationTypeEnum, …>`, khoá
> theo **giá trị** enum. Khi `TicketMerged` còn = 27, nó và `ChatEscalatedToAdmin` là **cùng một khoá**
> → thêm dòng `[TicketMerged] = Ticket` vào map sẽ ném `ArgumentException: An item with the same key
> has already been added` ngay lúc khởi tạo static → **chết cả NotificationService khi startup**.
> Đây cũng chính là lý do `GET /categories` hiện chỉ trả `ChatEscalatedToAdmin` cho giá trị 27:
> `TicketMerged` không thể tồn tại như khoá riêng.
- [x] B3 — BE: chạy test qua container `dotnet/sdk:8.0`; rebuild container; verify `/categories` = 35 mục — 2026-08-01
      - Full suite `NotificationService.UnitTests`: **459/460 pass**
      - 1 fail = `TicketMergedConsumerTests.Consume_DuplicateDelivery_CreatesOnlyOneNotification`
        → **flaky CÓ SẴN, không do ticket này**: baseline (đã stash thay đổi) fail **3/5 lần**,
        có thay đổi fail **1/3 lần**. Nguyên nhân: test publish 2 message rồi `Verify` mà **không chờ**
        consume xong (`:53-56`) — race trong test, không phải trong code sản phẩm.
        **Ngoài scope GH-83** (domain ticket-merge) → nên mở issue `type: test` riêng.
      - API verify: `count=35`, `TicketMerged{34, Ticket}` xuất hiện, `27=ChatEscalatedToAdmin{Sla}` giữ nguyên, Blog 25/26 → `Account`
- [x] B4 — Mobile: enums (status +2, type +16 = 19–33 + `TicketMerged:34`, category mới, voice status) + `isUnread` + `ICON_MAP` — 2026-08-01
      - `tsc --noEmit` PASS · lint 4 file mới: **0 error**, 6 warning đều là `no-redeclare`
      - ⚠️ Tổng lint 69 → **71 problems (1 error + 70 warning)**. +2 warning là **không tránh được**:
        mỗi `as const` enum mới (`NotificationCategoryEnum`, `VoiceTranscriptionStatusEnum`) đẻ đúng
        1 `no-redeclare` — hệ quả của chính pattern mà `rules/tech/mobile.md` bắt buộc.
        1 error vẫn là `datetimepicker` có sẵn trên `dev`, không phải của ticket này.
      - `VoiceTranscriptionStatusEnum` dùng **string value** (TicketService trả chuỗi), khác các enum int của NotificationService
- [x] B5 — Mobile: types + `endpoints.ts` + `queryKeys.ts` — 2026-08-01 · `tsc` PASS
      - `NotificationPreferenceDto` 7 → 11 field; `notification-matrix.types.ts` mới
      - `endpoints.ts`: `MATRIX`, `CATEGORIES`, `MARK_OPENED`, `CHAT_VOICE_RETRY`
      - `queryKeys.ts`: `notificationPreferences.matrix()`, `.categories()`
      - 🔴 **Phát hiện tầng 2 của bug mất dữ liệu:** `notificationPreference.schema.ts` chỉ khai 7 field.
        Form gửi `parsed.data` (kết quả `safeParse`), mà Zod **strip mọi key không có trong schema** →
        sửa type + payload thôi vẫn rụng field, bug y nguyên. Đã thêm 4 field vào schema.
        Bài học: type/payload/schema là **ba** chỗ phải khớp, không phải hai.
      - Kéo sớm phần form của B7 (state + effect + payload + 3 toggle chat) vì `tsc` đỏ chặn ngay khi
        đổi type — không thể để tree không compile giữa 2 bước
- [x] B6 — Mobile: services + hooks (matrix, markOpened, retryVoice) — 2026-08-01 · `tsc` PASS
      - `notification-matrix.service.ts` + `useNotificationMatrix` / `useNotificationCategoryMap`
      - `notification.service.markOpened` + `useMarkNotificationOpened` — **nuốt lỗi có chủ đích**
        (telemetry hỏng không được chặn điều hướng của user)
      - `ticketChatActions.retryVoice` + `useRetryVoiceChat` — 202 nên **chỉ invalidate**, không setQueryData
- [x] B7 — Mobile: `NotificationPreferencesForm` đổi nguồn sang `/matrix` + 11 field + 3 toggle chat — 2026-08-01 · `tsc` PASS
      - Đọc từ `matrix.data.channels`; ghi vẫn qua `PUT /notification-preferences` (PUT /matrix chỉ nhận `items`)
      - `updatePref.onSuccess` phải **vá thêm nhánh `channels` trong cache matrix**, không thì UI hiện
        giá trị cũ tới khi cache hết hạn dù BE đã lưu đúng
- [x] B8 — Mobile: `CategoryMatrixTable` — 2026-08-01 · `tsc` PASS
      - 6 nhóm × 4 kênh, nhãn "kế thừa" khi `isCustomized=false`
      - Kênh tắt toàn cục ⇒ ô bị **khoá + gạch ngang tiêu đề cột**, tránh user bật rồi tưởng sẽ nhận được
      - Chạm ô là `PUT /matrix` ngay với **đúng 1 dòng**, đủ 4 kênh; nhãn nhóm map sang tiếng Việt,
        fallback `categoryName` nếu BE thêm nhóm mới
- [x] B9 — Mobile: `push.ts` listener + cold-start + gắn ở `app/_layout.tsx` — 2026-08-01 · `tsc` PASS
      - `readPushData()` + `addPushResponseListener()` trong `push.ts` (wrapper thuần expo-notifications)
      - `PushResponseHandler.tsx` giữ phần router + mutation — không nhét vào `push.ts` để lib tầng dưới
        không phụ thuộc ngược lên UI
      - **Cold-start** qua `getLastNotificationResponseAsync()`; dùng `handlerRef` để listener đăng ký
        đúng 1 lần — đăng ký lại mỗi render sẽ làm rơi sự kiện cold-start (chỉ phát 1 lần)
      - `app/_layout.tsx` chỉ thêm 1 dòng `<PushResponseHandler />`, giữ đúng nguyên tắc chạm tối thiểu
- [x] B10 — Mobile: `NotificationList` deep-link → `/opened` — 2026-08-01 · `tsc` PASS
      - Có deep-link → `markOpened`; không → `markRead`. **Không gọi cả hai** (BE tự set `ReadAt` khi `Opened`)
- [x] B11 — Mobile: voice `Failed` badge + nút retry — 2026-08-01 · `tsc` PASS
      - `TicketCommentDTO.voiceTranscriptionStatus` (**string**, TicketService trả chuỗi)
      - `VoiceMessageBubble`: chỉ `Failed` mới hiện khối lỗi + "Thử lại"; `Pending`/`Processing` im lặng
        (BE xử lý nền — hiện spinner sẽ làm user tưởng tin nhắn chưa gửi được)
      - Nối ở `ChatBubble` vì `comment` đã có `ticketId` → không phải luồn prop qua mọi màn gọi nó
- [x] B12 — Quality gate — 2026-08-01
      - `npx tsc --noEmit` **PASS**
      - `npm run lint`: **71 problems (1 error + 70 warning)** vs baseline **69 (1 error + 68)** = **+2**,
        cả 2 là `no-redeclare` của `NotificationCategoryEnum` + `VoiceTranscriptionStatusEnum` —
        không tránh được vì pattern `as const` là **bắt buộc** theo `rules/tech/mobile.md`.
        1 error vẫn là `datetimepicker` có sẵn trên `dev`.
      - Delta đo bằng `git stash` + so output, **không ước lượng**. Nhờ đó bắt được 2 rác của chính mình
        đã dọn: import thừa `NotificationPreferenceDto` ở `CategoryMatrixTable`, và `import/first` do đặt
        `export ... from` xen giữa khối import ở `ticket.types.ts`.
      - **Verify AC trên stack thật:**
        - `PUT /matrix` chỉ gửi nhóm Chat(5) → Chat `email True→False`, `isCustomized False→True`;
          nhóm Sla **không bị đụng** ✓
        - `PUT` 11 field → `chat=False mention=False reaction=True digest=45` giữ nguyên ✓
          (lặp lại đúng thí nghiệm từng chứng minh bug, nay không còn reset)

> ⚠️ **Chưa verify được ở tầng UI** (render bảng ma trận, badge voice Failed, bấm push): cần
> simulator/thiết bị thật, chưa chạy trong phiên này. Ba AC còn lại phụ thuộc việc đó:
> hiển thị nhãn "kế thừa", badge + nút "Thử lại", và bấm push → `/opened`.
> Riêng AC push còn cần **BE deploy** bản có `notificationId`.

## Câu hỏi đã giải đáp
| Câu hỏi | Chốt |
|---|---|
| Matrix vs form #43 | Cùng 1 màn, `GET /matrix` là nguồn duy nhất |
| Endpoint 4 không có `notificationId` | Sửa thẳng BE, **không tạo issue** BE |
| Push listener tới đâu | Tối thiểu: response listener → `/opened` + deep-link + cold-start |
| Voice retry | Làm đủ: DTO + badge `Failed` + nút retry |
| DTO 7→11 field | Thêm đủ 11, **hiện 3 toggle chat** trên UI |
| Lỗi BE enum 27 + map thiếu 25/26 | Sửa luôn cả 2 |
| Enum status + type mobile | Sync đủ cả 2 enum |

## Rủi ro
1. **Scope lớn** — 21 file mobile + 5 file BE, 2 repo, 2 PR. Nếu cần cắt, ứng viên tách trước là
   **voice retry** (khác domain, ít phụ thuộc phần còn lại).
2. **Đổi giá trị enum** `TicketMerged` 27→34: DB local sạch (0 record type=27), nhưng nếu staging đã
   có dữ liệu thì phải migrate. **Cần xác nhận trước khi merge BE.**
3. **PR mobile phụ thuộc PR backend** — push tap chỉ chạy đủ khi BE deploy. Mobile đã thủ sẵn nhánh
   thiếu `notificationId` nên không vỡ, nhưng AC "bấm push gọi `/opened`" chỉ verify được sau khi BE lên.
4. `app/_layout.tsx` là file gốc — chạm vào có rủi ro ảnh hưởng toàn app; giữ thay đổi tối thiểu.
5. **PR GH-83 sẽ chứa thay đổi ngoài scope ticket** — quyết định của user (2026-08-01): mang theo
   phần **gỡ feature KB** đang dở trên `dev` (7 file, ~810 dòng xoá: `app/(customer)/kb/*`,
   `knowledge.tsx`, `KbRelatedSection`, `PopularKbSection`, `(tabs)/_layout.tsx`, `dashboard.tsx`)
   và `docs/mobile-restructure-plan.md`. Docs sync Sprint 6.3 (`api-notification.md`,
   `api-ticket.md`) thì hợp lý vì là contract của chính ticket này.
   → **Reviewer cần được báo trước**, nếu không sẽ mất thời gian truy vì sao PR notification lại xoá KB.
