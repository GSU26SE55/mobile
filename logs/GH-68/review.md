## BÁO CÁO CODE REVIEW — feat/GH-68-chat-permissions-incident-api — 2026-07-08
### Scope: FE (Mobile)
### Effort: Deep (nhiều file, cross customer+staff, chạm chat core + realtime)

> **Lưu ý về diff:** GH-68 hiện **chưa commit** (working tree + untracked). `git diff dev...HEAD` chỉ hiện GH-67 (committed) — review này dựa trên working-tree diff (`git diff HEAD`) + các file untracked của GH-68.

### TÓM TẮT
10 endpoint "Mọi role" wired full-UI (cursor chat, unread badge, reactions, download, inbox/mentions, GDPR erase, permission catalog, incident-active). Kiến trúc chuẩn (service → hook → UI), tsc PASS, expo lint 0 errors. Không có lỗi Critical. Vài Warning về UX/phòng thủ. **PASS**.

### PHÂN TÍCH

**✅ Pass**
- ✅ **Architecture**: mọi API qua `services/` → hook TanStack Query, không fetch trực tiếp trong component (`chatInbox.service`, `permission.service`, `ticketChatActions.service`, `incident.service`).
- ✅ **Feature isolation**: `features/permissions/*` chỉ import `lib/` (theme/axios/endpoints/queryKeys/api.types) — không cross-feature. Các screen `app/(customer|staff)/chats` compose `features/tickets` (screen→feature: hợp lệ). Không có `features/A → features/B`.
- ✅ **queryKey**: tất cả dùng `QUERY_KEY` factory (`tickets.chatUnreadCount/chatReactions`, `chatsInbox.list`, `chatMentions.list`, `permissions.catalog`, `incidents.bySiteActive`). `invalidate` dùng `KEY`/`QUERY_KEY` root — không hardcode string.
- ✅ **Mutation onError**: `useChatReactions` (add/remove), `useChatInbox` (ack/erase) đều `handleErrorApi({ error })`. `useDownloadChatAttachment` cố ý branch status thủ công (202/451 là success-path, axios không throw) — screen truyền `onError` Alert. Đúng thiết kế plan.
- ✅ **Realtime fix**: `useTicketCommentsRealtime.prependComment` bỏ `totalItems: first.totalItems+1` + đổi type sang `CursorPaginationResponse` — hết nguy cơ NaN. `CommentsPage` type khớp cursor.
- ✅ **Xóa hẳn `useTicketComments`** — grep sạch, không còn 2 hook chung key `tickets.chats(id)`.
- ✅ **Route registration**: mọi screen mới đăng ký đủ `_layout.tsx` (customer root + settings + chats folder-group; staff root leaf). Typed routes regenerate → tsc PASS. Không route mồ côi.
- ✅ **Auth/role**: screen mới nằm dưới `(customer)`/`(staff)` → kế thừa role-gate ở group `_layout` (Redirect nếu sai role). Không cần wrap riêng.
- ✅ **No console.log**, không hardcode URL/token (dùng `BASE_URL` + `ENDPOINTS`), loading/error state có ở mọi screen (ActivityIndicator + EmptyState).
- ✅ **Enum pattern**: `ReactionTypeEnum` theo `as const` + type alias, đặt `shared/enums/ticket.enum.ts`, re-export qua `ticket.types.ts` — đúng convention.

**🟡 Warning**
- ✅ **[FIXED] #1 Download song song** — `app/(customer|staff)/tickets/[id].tsx` đổi `mutate` → `mutateAsync` + loop `for...await` **tuần tự** (stop-on-error), không còn nhiều `Sharing.shareAsync` cùng lúc.
- 🟡 **#2 (giữ)** `useDownloadChatAttachment.ts` — `fileName = tep-${fid.slice(0,8)}` không có đuôi (list thiếu contentType/fileName). Chấp nhận — nếu cần đuôi thật phải `getFileMetadata(fileId)` (thêm 1 request), chưa đáng cho scope này.
- 🟡 **#3 (giữ)** `useChatReactions.ts` — chỉ `invalidate` (không optimistic). Đúng count sau refetch, trễ nhỏ — chấp nhận.
- ✅ **[FIXED] #4** `SiteActiveIncidentsWidget.tsx` — bỏ `Radius?.md ?? 12` / `Colors.dangerLight ?? '...'` → dùng thẳng `Radius.md` / `Colors.dangerLight`.

### RỦI RO & LƯU Ý
- **Base branch (ship-time)**: branch tách từ `feat/GH-67-staff-chat-dashboard-api` (đang có uncommitted GH-67), KHÔNG từ `dev`. `git diff dev...HEAD` lẫn GH-67. Khi `/kltn-ship`: GH-67 nên merge `dev` trước, hoặc PR GH-68 target GH-67 — nếu không diff PR sẽ chứa cả GH-67. **Không phải lỗi code**, nhưng phải xử lý trước khi tạo PR.
- **Runtime chưa chạy device**: cursor pagination + realtime prepend, reaction toggle (khớp `currentUserId` với `reactions.users[].userId`), download share sheet — mới verify ở tầng type. `/kltn-test` cần chạy thực để xác nhận (đặc biệt cursor + realtime không double, badge unread).
- **Reaction toggle** giả định `currentUserId` (JWT AccountId) trùng id trong `reactions.users[].userId` do BE trả — hợp lý nhưng nên xác nhận khi test.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao** (tsc + lint sạch, kiến trúc đúng chuẩn, không Critical). Warnings là UX/phòng thủ, không chặn ship. Lưu ý base-branch phải xử lý ở `/kltn-ship`.
