# Plan — GH-68: [Mobile] Customer chat/permissions/incident API gap — endpoint "Mọi role"

## Metadata
- **Status:** REVIEWING | **Role:** FE (Mobile) | **Ngày:** 2026-07-08
- **Issue:** #68 — https://github.com/GSU26SE55/mobile/issues/68
- **Sprint:** Sprint 1
- **Dev:** Trần Minh Trí (Shu1237)

> **Note:** Toàn bộ shape trong plan này đã **verify trực tiếp từ backend** (`/Users/shu/Documents/GSU26SE55/backend/services/TicketService`, `AuthService`) — không còn suy đoán. Xem cột "Nguồn BE" trong bảng Endpoints.

## Mục tiêu
Bổ sung 10 endpoint Auth "Mọi role" (Customer + Staff dùng chung) mà mobile còn thiếu, **full UI**: cursor pagination chat, unread badge, download attachment, reactions, inbox `/chats/me`, mentions, GDPR erase chat, permission catalog, và incident active theo site. Mỗi endpoint đi kèm service → hook (TanStack Query) → UI wire cho cả customer và staff.

## Scope
**Trong scope:**
1. **`GET .../chats/cursor`** — thay hẳn `useTicketComments` (page-based) bằng `useTicketChatsCursor`. Giữ query key `tickets.chats(id)`. Cursor BE trả `{items, nextCursor, hasMore}` — **KHÔNG có `totalItems`** → phải sửa `prependComment` trong realtime (xem mục dưới).
2. **`GET .../chats/unread-count`** — badge unread **chỉ ở header chat detail** (1 call/ticket). **KHÔNG** đặt trên ticket list item: BE chỉ có unread-count **per-ticket, không có bulk** (verified — không endpoint summary) → list item sẽ N+1 call. Badge tổng ở tab dùng `/chats/mentions/me?unreadOnly` hoặc bỏ.
3. **`GET .../chats/{chatId}/attachments/{fileId}/download`** — nút tải attachment. `{attachmentId}` route = **FileId** (BE match `a.FileId == attachmentId`) → dùng thẳng `attachmentFileIds`. 200 (URL) / 202 (đang scan) / 451 (nhiễm virus) / 404.
4. **`POST/DELETE .../chats/{chatId}/reactions`** — reaction bar dưới bubble + picker; count từ `comment.reactions` (BE luôn trả trong cursor/list).
5. **`GET /api/chats/me`** — inbox chat của user. **BE trả FLAT `TicketChatDTO[]`** (sort DESC CreatedAt, KHÔNG group theo ticket) → `ChatInboxList` render từng chat riêng (hiển ticketId + snippet), tap → mở ticket detail. Không dựng conversation-thread grouping (BE không group).
6. **`GET /api/chats/mentions/me`** — màn hình @mention tới mình (filter `unreadOnly`).
7. **`PATCH /api/chats/mentions/{id}/acknowledge`** — đánh dấu đã đọc mention.
8. **`POST /api/chats/erase-my-data`** — nút GDPR xóa nội dung chat của mình (Danger Zone).
9. **`GET /api/permissions`** — màn hình catalog permission read-only (`?module`).
10. **`GET /api/environmental-incidents/by-site/{siteId}/active`** — widget "Sự cố đang xảy ra" trên màn site detail (customer + staff).

**Ngoài scope:**
- Endpoint chỉ Staff/Manager/Admin (pin, export-pdf, closed-override, chats/search, readers).
- Reply/thread UI (`/chats/{id}/replies`).
- Không đụng `POST /chats`, voice, translate, edit/delete (đã hoạt động).
- Không thêm feature-gate mới bằng catalog (vẫn dùng `ME_PERMISSIONS` GH-47).

**Ngoại lệ có kiểm soát (bắt buộc chạm, không phải scope creep):**
- **`useTicketCommentsRealtime.prependComment`** — hiện tính `totalItems: first.totalItems + 1` (dòng 35). Cursor page **không có** `totalItems` → `undefined + 1 = NaN`. **Fix bắt buộc:** bỏ dòng `totalItems` (CommentThread/screens không đọc `totalItems`, chỉ đọc `hasNextPage` do react-query tự suy ra). Thay đổi tối thiểu 1 dòng — không refactor logic prepend/dedup/typing.

## Endpoints
| Method | Path | Request → Response | Nguồn BE (verified) |
|--------|------|--------------------|---------------------|
| GET | `/api/tickets/{id}/chats/cursor` | `?cursor&limit(clamp 1..100,def20)` → `CommonResponse<CursorPaginationResponse<TicketChatDTO>>` `{items,nextCursor,hasMore}` (sort DESC newest-first) | `TicketChatsCursorQueryHandler.cs`, `CursorPaginationResponse.cs` |
| GET | `/api/tickets/{id}/chats/unread-count` | → `CommonResponse<{ unreadCount:int }>` | docs api-ticket:1093 |
| GET | `/api/tickets/{tid}/chats/{chatId}/attachments/{fileId}/download` | → `CommonResponse<string>` Data=URL; **HTTP status = 200 / 202 (scan) / 451 (infected) / 404**. URL = `{fileStorage}/api/files/{fileId}/download` (cần auth) | `ChatAttachmentDownloadQueryHandler.cs`, controller `DownloadChatAttachment` |
| POST | `/api/tickets/{tid}/chats/{chatId}/reactions` | body `{ reactionType:"ThumbsUp" }` → `CommonResponse<TicketChatReactionsAggregateDTO>` | controller + `TicketChatReactionsAggregateDTO.cs` |
| DELETE | `/api/tickets/{tid}/chats/{chatId}/reactions` | `?type=ThumbsUp` → `CommonResponse<TicketChatReactionsAggregateDTO>` | — |
| GET | `/api/chats/me` | `?page&pageSize` → `CommonResponse<PaginationResponse<TicketChatDTO>>` | `MyChatsQueryHandler.cs` |
| GET | `/api/chats/mentions/me` | `?unreadOnly&page&pageSize` → `CommonResponse<PaginationResponse<TicketChatMentionDTO>>` | docs api-ticket:1210 |
| PATCH | `/api/chats/mentions/{id}/acknowledge` | → `CommonResponse<object>` | docs api-ticket:1221 |
| POST | `/api/chats/erase-my-data` | → `CommonResponse<{ erasedCount:int }>` | docs api-ticket:1190 |
| GET | `/api/permissions` | `?module` → `CommonResponse<List<PermissionDto>>` (sort Module→Code) | `PermissionsController.cs`, `PermissionDto.cs` |
| GET | `/api/environmental-incidents/by-site/{siteId}/active` | → `CommonResponse<PaginationResponse<EnvironmentalIncidentDto>>` (chỉ Open/Acknowledged) | docs api-battery:1895 |

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/endpoints.ts` | modify | `TICKETS.CHATS_CURSOR/CHAT_UNREAD_COUNT/CHAT_ATTACHMENT_DOWNLOAD/CHAT_REACTIONS`; group `CHATS`(ME/MENTIONS_ME/MENTION_ACK/ERASE_MY_DATA); `PERMISSIONS.CATALOG`; `ENVIRONMENTAL_INCIDENTS.BY_SITE_ACTIVE`. ⚠️ Giữ tên `CHAT_UNREAD_COUNT` phân biệt với `NOTIFICATIONS.UNREAD_COUNT` đã có (MỚI-8) — không rút gọn |
| `src/lib/queryKeys.ts` | modify | `KEY.chatsInbox`,`KEY.chatMentions`; `tickets.chatUnreadCount/chatReactions`; `permissions.catalog`; `incidents.bySiteActive` |
| `src/types/api.types.ts` | modify | `CursorPaginationResponse<T>` `{items,nextCursor,hasMore}` |
| `src/features/tickets/types/ticket.types.ts` | modify | **Extend `TicketCommentDTO`** thêm optional: `reactions?`,`mentions?`,`attachments?`,`bodyFormat?`,`bodyHtml?`,`isPinned?`,`editedAt?`,`lastEditedByUserId?`; thêm `ReactionTypeEnum`(as const), `TicketChatReactionsAggregateDTO`,`ChatReactionGroupDTO`,`ChatReactionUserDTO`,`TicketChatMentionDTO`,`TicketAttachmentDTO` |
| `src/features/tickets/services/ticketChatActions.service.ts` | modify | `listCursor`,`getUnreadCount`,`addReaction`,`removeReaction`,`downloadAttachment`(validateStatus true) |
| `src/features/tickets/services/chatInbox.service.ts` | create | `getMyChats`,`getMyMentions`,`acknowledgeMention`,`eraseMyData` |
| `src/features/tickets/hooks/useTicketChatsCursor.ts` | create | Infinite query cursor — **thay** `useTicketComments` |
| `src/features/tickets/hooks/useTicketComments.ts` | **delete** | Xóa hẳn sau khi 2 screen chuyển sang cursor (tránh 2 hook ghi chung key) |
| `src/features/tickets/hooks/useTicketCommentsRealtime.ts` | modify | `prependComment`: bỏ `totalItems: first.totalItems + 1` (cursor không có totalItems → NaN) |
| `src/features/tickets/hooks/useTicketUnreadCount.ts` | create | Query badge unread |
| `src/features/tickets/hooks/useChatReactions.ts` | create | `useAddReaction`+`useRemoveReaction` (optimistic aggregate) |
| `src/features/tickets/hooks/useDownloadChatAttachment.ts` | create | Mutation: gọi chat download → 200 lấy URL → `FileSystem.downloadAsync`(auth header) → `Sharing.shareAsync`; branch 202/451/404 |
| `src/features/tickets/hooks/useChatInbox.ts` | create | `useMyChats`,`useMyMentions`,`useAcknowledgeMention`,`useEraseMyChatData` |
| `src/features/tickets/components/ChatBubble.tsx` | modify | `ReactionBar` từ `comment.reactions`; action "Tải tệp đính kèm" khi có `attachmentFileIds` |
| `src/features/tickets/components/CommentThread.tsx` | modify | (data vẫn nhận qua prop `comments` — chỉ cần type khớp DTO đã extend; wire reaction callbacks) |
| `src/features/tickets/components/ReactionBar.tsx` | create | Bar count + picker reaction dùng chung |
| `src/features/tickets/components/ChatInboxList.tsx` | create | List item inbox/mention dùng chung customer+staff |
| `app/(customer)/tickets/[id].tsx` | modify | Swap `useTicketComments`→`useTicketChatsCursor`; wire reaction/download; unread badge header |
| `app/(staff)/tickets/[id].tsx` | modify | Swap `useTicketComments`→`useTicketChatsCursor`; wire reaction/download; unread badge header |
| `src/features/permissions/types/permission.types.ts` | create | `PermissionDto` |
| `src/features/permissions/services/permission.service.ts` | create | `getCatalog(module?)` |
| `src/features/permissions/hooks/usePermissionCatalog.ts` | create | Query catalog (staleTime dài) |
| `src/features/permissions/components/PermissionCatalogList.tsx` | create | Group theo `module` |
| `src/features/incidents/services/incident.service.ts` | modify | `getActiveBySite(siteId)` |
| `src/features/incidents/hooks/useSiteActiveIncidents.ts` | create | Query incident active theo site |
| `src/features/incidents/components/SiteActiveIncidentsWidget.tsx` | create | Widget cảnh báo dùng chung |
| `app/(customer)/chats/_layout.tsx` | create | **Stack nhóm chats** (index + mentions) — theo pattern `settings/`/`kb/` |
| `app/(customer)/chats/index.tsx` | create | Inbox screen |
| `app/(customer)/chats/mentions.tsx` | create | Mentions screen |
| `app/(customer)/_layout.tsx` | modify | **Đăng ký `<Stack.Screen name="chats" headerShown:false>`** (như `settings`/`kb`) |
| `app/(customer)/settings/permissions.tsx` | create | Permission catalog screen |
| `app/(customer)/settings/_layout.tsx` | modify | **Thêm `<Stack.Screen name="permissions" options={{title:'Danh mục quyền'}}/>`** (bắt buộc — layout khai báo tường minh từng screen) |
| `app/(customer)/settings/danger-zone.tsx` | modify | Nút "Xóa dữ liệu chat (GDPR)" |
| `app/(customer)/settings/index.tsx` | modify | Thêm 2 phần tử `ITEMS[]`: "Danh mục quyền" → `/(customer)/settings/permissions`; "Hộp thư chat" → `/(customer)/chats` |
| `app/(customer)/sites/[id].tsx` | modify | Gắn `SiteActiveIncidentsWidget` |
| `app/(staff)/chats/index.tsx` | create | Inbox screen (staff — self-header như `tools/index`) |
| `app/(staff)/chats/mentions.tsx` | create | Mentions screen (staff) |
| `app/(staff)/tools/permissions.tsx` | create | Permission catalog (staff — trong `tools/`, self-header) |
| `app/(staff)/tools/index.tsx` | modify | **Thêm `ROW` "Danh mục quyền" + mở rộng `href` union type** |
| `app/(staff)/_layout.tsx` | modify | **Đăng ký `<Stack.Screen name="chats/index"/>`, `"chats/mentions"`, `"tools/permissions"`** (layout liệt kê từng leaf route) |
| `app/(staff)/sites/[id].tsx` | modify | Gắn `SiteActiveIncidentsWidget` |

## Enums / Types (shape đã verify từ BE)
```ts
// api.types.ts
interface CursorPaginationResponse<T> { items: T[]; nextCursor: string | null; hasMore: boolean; }

// ticket.types.ts — extend TicketCommentDTO (thêm optional, không phá consumer cũ)
const ReactionTypeEnum = { ThumbsUp:'ThumbsUp', Acknowledged:'Acknowledged', Resolved:'Resolved', NeedMoreInfo:'NeedMoreInfo', Disagree:'Disagree' } as const;
type ReactionTypeEnum = (typeof ReactionTypeEnum)[keyof typeof ReactionTypeEnum];

interface ChatReactionUserDTO { userId: string; role: ActorRoleEnum; }
interface ChatReactionGroupDTO { count: number; users: ChatReactionUserDTO[]; }
interface TicketChatReactionsAggregateDTO {
  thumbsUp: ChatReactionGroupDTO; acknowledged: ChatReactionGroupDTO; resolved: ChatReactionGroupDTO;
  needMoreInfo: ChatReactionGroupDTO; disagree: ChatReactionGroupDTO;
}
interface TicketChatMentionDTO {
  id: string; chatId: string; ticketId: string | null; mentionedUserId: string;
  mentionedUserRole: ActorRoleEnum; mentionedDisplayName: string | null;
  isAcknowledged: boolean; acknowledgedAt: string | null; createdAt: string;
}
interface TicketAttachmentDTO { id: string; fileId: string; fileName: string; contentType: string; sizeBytes: number; createdAt: string; }
// TicketCommentDTO += reactions?, mentions?, attachments?, bodyFormat?, bodyHtml?, isPinned?, editedAt?, lastEditedByUserId?

// permission.types.ts
interface PermissionDto { id: string; code: string; module: string; description: string | null; isSystemPermission: boolean; createdAt: string; }
```

## Approach
- **Cursor migration:** `useTicketChatsCursor` = `useInfiniteQuery` giữ key `tickets.chats(id)`; `initialPageParam: undefined`; `getNextPageParam: (last) => last.hasMore ? last.nextCursor : undefined`; queryFn gọi `listCursor(id,{cursor,limit:20})`. **Hook được gọi trực tiếp ở 2 SCREEN** (`app/(customer)/tickets/[id].tsx:174`, `app/(staff)/tickets/[id].tsx:140`), **KHÔNG ở `CommentThread`** — `CommentThread` chỉ nhận `comments`/`hasNextPage`/`onLoadMore` qua props. Swap phải ở 2 screen; xóa `useTicketComments` để tránh 2 hook cùng ghi key `tickets.chats(id)` (cache conflict). 2 screen flatten `data.pages.flatMap(p=>p.items)` → prop `comments`. `prependComment` bỏ `totalItems` → realtime tương thích cursor.
- **Giữ dedup Set-by-id (MỚI-3):** 2 screen hiện dedup comment bằng `Set<id>` (offset+realtime có thể trùng ở ranh giới trang). Cursor đổi cơ chế ranh giới nhưng **giữ nguyên logic dedup theo `id`** khi flatten — vẫn cover trùng do realtime prepend + refetch; không được vô tình bỏ khi sửa 2 screen.
- **Reactions (KHÔNG chờ BE — verified):** cả 3 list handler (cursor/list/my-chats) **populate `Reactions` thật** từ DB (`ChatChildDataLoader.LoadReactionsAsync`) → `comment.reactions` có count thật trong mọi trang cursor. `ReactionBar` cần prop `currentUserId` để biết user đã react loại nào (`group.users[]` chứa userId). Tap loại → `useAddReaction`/`useRemoveReaction` (toggle). Optimistic update aggregate, reconcile bằng response; invalidate `tickets.chats(id)`. `grep reaction src=0` = mobile chưa có client (chính là scope ticket), KHÔNG phải thiếu data BE.
- **Attachment download (KHÔNG blocked):** `downloadAttachment(ticketId, chatId=comment.id, fileId)` với `validateStatus:()=>true`. **Branch status THỦ CÔNG trong hook, KHÔNG dùng `handleErrorApi`** (202/451 là success-path, axios không throw → `handleErrorApi` không bao giờ chạy; nếu áp pattern form try/catch sẽ nuốt 202/451 im lặng — MỚI-9): 200 → `res.data.data` = URL → `FileSystem.downloadAsync(url, cacheDir+fileName, { headers:{Authorization:Bearer} })` → `Sharing.isAvailableAsync()` ? `shareAsync` : `Linking.openURL`; 202 → toast "đang quét virus, thử lại"; 451 → toast "file nhiễm virus"; 404 → toast "không tìm thấy". List chỉ có `attachmentFileIds` (không contentType) → nút "Tải tệp đính kèm" trong long-press menu bubble, tải tuần tự (ảnh vẫn tap-to-view).
- **Inbox/mentions:** query page-based, pageSize 20. `ChatInboxList` item → `router.push` ticket detail. Mention item có nút "Đã đọc" → `useAcknowledgeMention` → invalidate `KEY.chatMentions`.
- **Permission catalog:** query staleTime dài; group theo `module` render section list read-only.
- **Site active incidents — giữ endpoint riêng `/by-site/{siteId}/active` (verified BE):** `ActiveEnvironmentalIncidentsBySiteQueryHandler` filter `Status==Open || Acknowledged` server-side trong **1 call**, không phân trang. **KHÔNG** tái dùng `LIST` vì `LIST.Status` là enum đơn (`EnvironmentalIncidentStatusEnum?`) → không diễn đạt được "Open OR Acknowledged" trong 1 call (phải 2 call, hoặc no-status + client-filter over-fetch). Endpoint riêng ít code hơn + đúng semantics. Reuse `EnvironmentalIncidentDto`+`IncidentStatusBadge`; widget chỉ render khi `items.length>0`; tap → `incidents/[id]`.

## Edge Cases
- **Realtime `totalItems` NaN** (đã xử lý): cursor page không có `totalItems` → bỏ dòng `totalItems: first.totalItems+1` trong `prependComment`.
- **2 hook chung key**: xóa hẳn `useTicketComments` — không để cả nó và cursor cùng mount ghi `tickets.chats(id)`. **Hook swap ở 2 screen** `tickets/[id].tsx` (customer+staff), không ở `CommentThread`.
- **Dedup sau cursor**: giữ nguyên `Set<id>` khi flatten pages (cursor đổi ranh giới trang; dedup-by-id vẫn an toàn với realtime prepend).
- **Reactions optional**: đọc `comment.reactions?.thumbsUp?.count ?? 0` phòng khi BE (list cũ) không trả; double-tap/mất mạng → rollback optimistic.
- **Download**: HTTP status là 202/451 (không throw nhờ `validateStatus`); URL cần auth header khi `FileSystem.downloadAsync`; `Sharing` không khả dụng → fallback `Linking.openURL`.
- **Erase GDPR** không hoàn tác → confirm 2 bước; sau thành công invalidate mọi `KEY.tickets` + `KEY.chatsInbox`.
- Inbox/mentions/permission/incident rỗng → EmptyState / widget ẩn.
- Cursor `limit>100` → clamp 100 (BE cũng `Math.Clamp(1,100)`).

## Acceptance Criteria
- [ ] Chat detail load bằng cursor; scroll đáy fetch trang kế; realtime tin mới vẫn prepend đúng, **không có count NaN**.
- [ ] `useTicketComments` đã bị xóa, không còn import nào (grep sạch).
- [ ] **Chỉ** header chat detail hiện badge unread đúng số (KHÔNG đặt trên ticket list item — tránh N+1, BE không có bulk unread).
- [ ] Reaction bar hiển count; thêm/gỡ cập nhật tức thì; đồng bộ sau refetch.
- [ ] Nút tải attachment: 200 mở share sheet, 202/451/404 toast tương ứng.
- [ ] Màn inbox `/chats/me` liệt kê chat, tap mở đúng ticket.
- [ ] Màn mentions liệt kê @mention; filter unreadOnly; "Đã đọc" gọi acknowledge và cập nhật.
- [ ] Danger Zone có nút xóa chat GDPR, confirm 2 bước, báo `erasedCount`.
- [ ] Màn permission catalog hiện đầy đủ permission group theo module (customer + staff).
- [ ] Site detail (customer + staff) hiện widget incident active khi có; ẩn khi rỗng; tap mở incident detail.
- [ ] Mọi screen mới đã đăng ký ở `_layout.tsx` tương ứng (customer settings/chats, staff root) — không route mồ côi; header title đúng.
- [ ] `npx tsc --noEmit` PASS + regenerate typed routes (chạy `expo start` free-port 1 lần rồi dừng — lesson expo-router-typed-routes).

## Steps
- [x] Bước 1: Types — `CursorPaginationResponse`; extend `TicketCommentDTO` + reactions/mention/attachment types + `ReactionTypeEnum`; `permission.types.ts`. — 2026-07-08
- [x] Bước 2: Endpoints + queryKeys. — 2026-07-08 (tsc PASS)
- [x] Bước 3: Services — mở rộng `ticketChatActions` + `chatInbox` + `permission` + `incident.getActiveBySite`. — 2026-07-08 (tsc PASS)
- [x] Bước 4: Hooks — cursor (+ xóa `useTicketComments`), sửa `prependComment`, unread-count, reactions, download, inbox/mentions/ack/erase, permission catalog, site active incidents. — 2026-07-08 (tsc PASS)
- [x] Bước 5: Components — `ReactionBar`,`ChatInboxList`,`PermissionCatalogList`,`SiteActiveIncidentsWidget` ✅; `ChatBubble`+`CommentThread` (reaction bar + download menu) ✅; swap 2 screen + wire reaction/download ✅; unread badge header (customer+staff) ✅. — 2026-07-08 (tsc PASS)
- [x] Bước 6: Screens/routes — customer chats(_layout+index+mentions)/settings.permissions/danger-zone erase/settings rows/sites widget + đăng ký (customer)/_layout & settings/_layout; staff chats(index+mentions)/tools.permissions/tools row/sites widget + đăng ký (staff)/_layout. — 2026-07-08
- [x] Bước 7: `npx tsc --noEmit` PASS + regenerate typed routes (expo start CI) + `expo lint` 0 errors (68 warnings pattern có sẵn). — 2026-07-08

## Câu hỏi đã giải đáp
1. **Scope** → Full UI cho cả 10 endpoint (customer + staff, 1 ticket).
2. **Cursor pagination** → Thay hẳn `useTicketComments` sang cursor; **kèm sửa `prependComment` bỏ `totalItems`** (BE cursor không có field này — verified `CursorPaginationResponse.cs`).
3. **Attachment download** → Tải + share sheet (`expo-file-system`+`expo-sharing`, đã có từ GH-37); fallback `Linking.openURL`. **KHÔNG blocked** — `{attachmentId}`=FileId (verified `ChatAttachmentDownloadQueryHandler.cs`).
4. **Permission catalog** → Include, màn hình read-only (customer: settings, staff: tools).

## Ghi chú review (đã đối chiếu BE, sửa 4 điểm)
- **[đã sửa] Cursor NaN**: `prependComment` bỏ `totalItems` — carve vào scope "ngoại lệ có kiểm soát".
- **[đã sửa] Chung key**: xóa hẳn `useTicketComments`, không "giữ tạm".
- **[đã sửa] Reactions không phải dead code**: BE `TicketChatDTO.Reactions` luôn có trong cursor/list → extend `TicketCommentDTO`; đọc optional-safe.
- **[đã sửa] Attachment KHÔNG blocked**: route param là FileId → dùng `attachmentFileIds`; không cần `attachments[]`.
- **Quy mô lớn** (10 endpoint, ~30 file, customer+staff). Vẫn gói 1 ticket theo quyết định; nếu review/test nặng có thể tách sub-PR (chat core / inbox+mentions / permissions+incident).

### Review vòng 2 (đã đối chiếu BE)
- **[MỚI-1 — đã có sẵn, nhấn mạnh thêm]** Hook swap ở **2 screen** `tickets/[id].tsx`, không ở `CommentThread`. Files table đã liệt kê cả `app/(customer)/tickets/[id].tsx` + `app/(staff)/tickets/[id].tsx`; CommentThread chỉ nhận props. → không còn nguy cơ staff dùng hook cũ chung key.
- **[MỚI-2 — verify: GIỮ endpoint riêng]** `/by-site/{siteId}/active` **tồn tại** (`EnvironmentalIncidentsController.cs:221`), lọc Open+Acknowledged server-side 1 call. LIST `Status` enum đơn không thay thế được trong 1 call → giữ endpoint riêng là lựa chọn ít code/đúng nhất, không thừa.
- **[MỚI-3 — ghi nhận]** Giữ dedup `Set<id>` khi flatten cursor pages (đã thêm vào Approach + Edge Cases).

### Review vòng 3 (đăng ký route — verified layout)
- **[MỚI-4 — đã thêm vào Files]** Screen mới đăng ký **2 nơi**: (1) `settings/_layout.tsx` khai báo tường minh `<Stack.Screen name title>` → thêm `permissions`; (2) `settings/index.tsx` `ITEMS[]` → thêm row. Nhóm `chats/` mới = folder `_layout.tsx` (create) + `<Stack.Screen name="chats">` ở `(customer)/_layout.tsx`. Staff: đăng ký `chats/index`, `chats/mentions`, `tools/permissions` ở `(staff)/_layout.tsx` (liệt kê từng leaf). Thiếu các file layout này → header sai / route mồ côi khi regen `.expo/types`.
- **[MỚI-5 — chốt vị trí]** `app/(staff)/settings/` **không tồn tại** → permission staff đặt `app/(staff)/tools/permissions.tsx` + thêm `ROW` vào `tools/index.tsx` (mở rộng `href` union) + đăng ký `(staff)/_layout.tsx`. Không còn để mở.
- **[MỚI-6 — CHỐT: giữ endpoint riêng]** `/by-site/{siteId}/active` **verified tồn tại** và làm Open+Acknowledged trong **1 call** (LIST `Status` enum đơn không thay được trong 1 call). Là endpoint #10 issue yêu cầu wire. **User đã chọn giữ endpoint riêng** — thêm `getActiveBySite` + `useSiteActiveIncidents` + key `incidents.bySiteActive`.

### Review vòng 4 (đuôi — verified)
- **[MỚI-7 — REBUT: reactions KHÔNG chờ BE]** 3 list handler (cursor `:71/:95`, list `:140/:163`, my-chats `:36/:61`) **đều populate `Reactions` thật** qua `ChatChildDataLoader.LoadReactionsAsync`. `comment.reactions` có count thật trong mọi trang cursor → full-UI reactions khả thi ngay, không có BE dependency. `grep reaction src=0` = mobile chưa dựng client (scope ticket này). **Giữ full-UI reactions.**
- **[MỚI-8 — ghi nhận]** `NOTIFICATIONS.UNREAD_COUNT` đã tồn tại; giữ tên `TICKETS.CHAT_UNREAD_COUNT` phân biệt, không rút gọn (tránh nhầm import).
- **[MỚI-9 — ghi nhận]** Download branch status thủ công, KHÔNG dùng `handleErrorApi` (202/451 = success-path, axios không throw). Đã ghi vào Approach.
- **[Tự-audit] unread N+1**: BE unread-count chỉ per-ticket, không bulk → badge **chỉ** ở header detail, bỏ khỏi list item.
- **[Tự-audit] `/chats/me` flat**: BE trả `TicketChatDTO[]` phẳng (không group) → inbox render chat riêng lẻ, không dựng conversation grouping.
