# Plan — GH-67: [Mobile] Staff chat & dashboard API gap — 6 endpoint Staff-only

## Metadata
- **Status:** REVIEWING | **Role:** FE (Mobile) | **Ngày:** 2026-07-08
- **Issue:** #67 — https://github.com/GSU26SE55/mobile/issues/67
- **Sprint:** Sprint 1 (deadline 2026-05-30)
- **Dev:** Trần Minh Trí (SE183109)

## Mục tiêu
Bổ sung 6 endpoint Staff-only còn thiếu trên mobile (service → hook → UI):
(1) **Dashboard KPI** chính xác (đếm server-side thay client-count bị cap pageSize) + chart, và
(2) **5 thao tác chat nâng cao** trên màn ticket detail Staff: Pin/Unpin, Export PDF, AI Suggest, AI Summarize, AI Sentiment-check.

> **Toàn bộ contract dưới đây đã đối chiếu trực tiếp với source thật** (BE `backend/services/TicketService`, web `frontend/src`) — không suy đoán. Xem mục **Nguồn contract đã verify**.

## Scope
**Trong scope:**
- `GET /api/staff/tickets/dashboard/stats` → KPI cards + chart (SLA gauge, donut trạng thái, donut rủi ro SLA, bar trend 7 ngày) vẽ bằng **react-native-svg (đã cài)** — render đầu `(staff)/(tabs)/dashboard.tsx`.
- `GET /api/tickets/{id}/chats/export-pdf` → tải binary PDF, mở share sheet (expo-file-system + expo-sharing, theo pattern `useExportMyData`). Nút ở header ticket detail Staff.
- `POST /api/tickets/{id}/chats/suggest` → 3 gợi ý reply theo `intent`, chạm để chèn vào ô soạn.
- `POST /api/tickets/{id}/chats/summarize` → tóm tắt 5 dòng (modal).
- `POST /api/tickets/{id}/chats/sentiment-check` → badge cảm xúc Customer.
- `POST` + `DELETE /api/tickets/{id}/chats/{cid}/pin` → toggle ghim (tối đa 3/ticket) + badge "đã ghim" trên bubble.

**Quyết định tích hợp (review lần 2):**
- **[#3] Dashboard 1 nguồn số liệu:** filter-tab counts trong `dashboard.tsx` hiện đếm **client-side trên trang cap 100** → lệch KPI server khi staff > 100 ticket (tái sinh đúng bug issue muốn diệt). **Chốt:** đổi counts của 4 tab sang đọc từ `stats.countByStatus` (server, chính xác) qua đúng các hằng nhóm status có sẵn (`ACTIVE/WAITING/RESOLVED_STATUSES`). Danh sách `filtered` vẫn dùng `useStaffTickets` (list phân trang là bình thường). **KHÔNG** refactor quirk sẵn có (`Escalated` đang nằm trong `RESOLVED_STATUSES`) — giữ nguyên behavior, chỉ đổi nguồn đếm. Khi `stats` chưa load → tab ẩn số (không hiện số client sai).
- **[#6] Không hardcode `=== 'Closed'`:** tái dùng biến `ticketClosed` đã có ở `(staff)/tickets/[id].tsx:198` (`['Resolved','ClosedPendingRate','Closed','ClosedRejected'].includes(...)`) — truyền xuống `ChatAiToolbar` + dùng cho `canPin`. Nhất quán với `CommentThread` (đã nhận `ticketClosed`).

**Ngoài scope:**
- **KHÔNG thêm package mới** (react-native-svg đã đủ vẽ chart — đúng rule mobile.md).
- Reactions, kb-suggestions, translate (đã có), voice (đang làm ở nhánh `GH-voice-audio-bubble` uncommitted — **KHÔNG đụng**).
- Danh sách chat đã pin riêng / filter `isPinned` (chỉ badge + toggle).
- Admin/Manager dashboard toàn hệ thống (`GET /api/tickets/dashboard/stats`) — endpoint khác.
- Nhận SignalR alert khi sentiment Critical (BE tự gửi tới Manager; mobile chỉ hiển thị `isAlertSent`).
- Chỉ wire vào màn **Staff**; KHÔNG import toolbar/AI vào customer ticket screen.

## Endpoints (đã verify controller)
| Method | Path | Auth (BE attr) | Request / Response |
|--------|------|------|--------------------|
| GET | `/api/staff/tickets/dashboard/stats` | `[Authorize(Roles="Staff")]` | — → `CommonResponse<StaffTicketDashboardStatsDto>` |
| GET | `/api/tickets/{id}/chats/export-pdf` | `Manager,Admin,Staff` | — → `File("application/pdf")` tên `ticket-{ticketId}-chats.pdf` · `404` `{isSuccess:false,message}` khi không có chat |
| POST | `/api/tickets/{id}/chats/suggest` | `Staff,Manager,Admin` | `{ intent: string }` (default `TechnicalAnswer`) → `CommonResponse<ChatSuggestDTO>` |
| POST | `/api/tickets/{id}/chats/summarize` | `Staff,Manager,Admin` | — → `CommonResponse<ChatSummarizeDTO>` |
| POST | `/api/tickets/{id}/chats/sentiment-check` | `Staff,Manager,Admin` | — → `CommonResponse<ChatSentimentCheckDTO>` |
| POST | `/api/tickets/{id}/chats/{cid}/pin` | `Staff,Manager,Admin` | — → `TicketActionResponse` · `400` đã pin / đủ 3 |
| DELETE | `/api/tickets/{id}/chats/{cid}/pin` | `Staff,Manager,Admin` | — → `TicketActionResponse` · `400` chưa pin |

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/endpoints.ts` | modify | +6 path: `STAFF_TICKETS.DASHBOARD_STATS`; `TICKETS.CHAT_EXPORT_PDF/SUGGEST/SUMMARIZE/SENTIMENT/PIN` |
| `src/lib/queryKeys.ts` | modify | +`staffTickets.dashboardStats()` |
| `src/shared/enums/chat.enum.ts` | create | `ChatAiIntentEnum` (as const **string**) — mirror web `frontend/src/shared/enums/chat.enum.ts` |
| `src/features/staff/types/staff.types.ts` | modify | +`StaffTicketDashboardStatsDto`, `SlaSummaryDto`, `SlaRiskDto`, `DailyCountPointDto` |
| `src/features/staff/services/staffTicket.service.ts` | modify | +`getDashboardStats()` |
| `src/features/staff/hooks/useStaffDashboardStats.ts` | create | `useQuery`, `staleTime: 60_000` (snapshot) |
| `src/features/staff/components/StaffDashboardStats.tsx` | create | KPI cards + gauge + 2 donut + bar 7 ngày (react-native-svg) |
| `src/features/staff/components/charts/` (Donut, Bar, Gauge) | create | Chart primitive nhỏ bằng react-native-svg (dùng nội bộ StaffDashboardStats) |
| `app/(staff)/(tabs)/dashboard.tsx` | modify | Render `<StaffDashboardStats/>` **giữa `StaffHeader` và `filterRow`** (luôn hiện, KHÔNG làm `ListHeaderComponent` — sẽ bị ẩn khi list load/lỗi); **[#3]** đổi `counts` 4 tab sang đọc từ `stats.countByStatus` (single source), list vẫn `useStaffTickets` |
| `src/features/tickets/types/chat-actions.types.ts` | modify | +`ChatSuggestPayload`, `ChatSuggestDTO`, `ChatSummarizeDTO`, `ChatSentimentCheckDTO`, `ChatSentimentLabel` |
| `src/features/tickets/types/ticket.types.ts` | modify | +`isPinned/pinnedAt/pinnedByUserId` vào `TicketCommentDTO` |
| `src/features/tickets/services/ticketChatActions.service.ts` | modify | +`suggest/summarize/sentimentCheck/pin/unpin/exportPdf` |
| `src/features/tickets/hooks/useTicketChatActions.ts` | modify | +`useSuggestChat/useSummarizeThread/useSentimentCheck/usePinChat/useUnpinChat/useExportChatPdf` |
| `src/features/tickets/components/ChatBubble.tsx` | modify | **[#5]** +`canPin/isPinned/onPin/onUnpin` vào **cả** `ChatActionMenuProps` **và** `ChatBubbleProps` (optional, default false); cập nhật công thức `rowCount = …+ Number(canPin)` (L219) + `canShowActions` (L365); menu item "Ghim/Bỏ ghim" (label theo `isPinned`); **badge pinned mirror `internalBadge`** (ChatBubble.tsx:400-405 `comment.isInternal && <View internalBadge>`) → thêm block `comment.isPinned && <View pinnedBadge><Ionicons name="pin"/></View>`, style nhân từ `internalBadge` |
| `src/features/tickets/components/CommentThread.tsx` | modify | Pass-through `onPin/onUnpin`; `canPin = !ticketClosed && !!onPin` (rập khuôn `canEdit` L243); truyền `isPinned={comment.isPinned}` |
| `src/features/tickets/components/ChatAiToolbar.tsx` | create | Thanh nút Suggest/Summarize/Sentiment/Export trên ô soạn reply. Nhận prop `disabled` (= `ticketClosed`). **Chỉ import trong `(staff)/tickets/[id].tsx`** |
| `app/(staff)/tickets/[id].tsx` | modify | Wire toolbar + pin handlers + export + chèn suggestion vào input |

## Enums / Types (verify từ BE + web)
```ts
// chat.enum.ts — mirror web; BE JsonStringEnumConverter nhận string name
export const ChatAiIntentEnum = {
  RequestInfo: 'RequestInfo',
  TechnicalAnswer: 'TechnicalAnswer', // default
  Resolution: 'Resolution',
  FollowUp: 'FollowUp',
} as const;
export type ChatAiIntentEnum = (typeof ChatAiIntentEnum)[keyof typeof ChatAiIntentEnum];

// chat-actions.types.ts
export type ChatSentimentLabel = 'Positive' | 'Neutral' | 'Negative' | 'Critical';
interface ChatSuggestPayload { intent: ChatAiIntentEnum; }         // gửi STRING
interface ChatSuggestDTO { suggestionId: string; suggestions: string[]; }
interface ChatSummarizeDTO { summary: string; }
interface ChatSentimentCheckDTO { score: number; label: ChatSentimentLabel; isAlertSent: boolean; }

// staff.types.ts (khớp web dashboardStats.types.ts §B)
interface SlaSummaryDto { met: number; breached: number; running: number; paused: number; compliancePercent: number; }
interface SlaRiskDto { healthy: number; near: number; breached: number; }
interface DailyCountPointDto { date: string; count: number; }   // date "yyyy-MM-dd"
interface StaffTicketDashboardStatsDto {
  openCount: number; resolvedCount: number; nearBreachCount: number;
  breachedCount: number; pausedCount: number; slaMonitoredCount: number;
  sla: SlaSummaryDto;
  countByStatus: Record<string, number>;   // BE zero-fill đủ 14 status; FE vẫn default 0 khi đọc
  slaRisk: SlaRiskDto;
  createdTrend7Days: DailyCountPointDto[];  // đúng 7 điểm, ngày trống = 0
}

// ticket.types.ts — thêm vào TicketCommentDTO
isPinned: boolean; pinnedAt: string | null; pinnedByUserId: string | null;
```

## Approach
- **Service/hook**: mở rộng `ticketChatActionsService` (chat actions dùng chung base `/api/tickets/{id}/chats`) + `staffTicket.service`. Không tạo axios instance mới.
- **`intent` = STRING** (`"TechnicalAnswer"`). Bằng chứng: web `chat.enum.ts` gửi string; BE `Program.cs` đăng ký `JsonStringEnumConverter` (nhận string name). Memory "request=int" chỉ áp dụng cho **query-string filter** (vd `?Status=2`), KHÔNG cho JSON body enum → không mâu thuẫn. **Bỏ fallback int.**
- **[LẦN 3 #1] AI error đi qua `onError`, KHÔNG check `onSuccess`**: `axios.ts:143-153` — interceptor **tự reject** khi 200 `isSuccess:false` (→ `EntityError` nếu có `listErrors`, ngược lại `HttpError`). Vậy AI rate-limit (Gemini 429 wrap isSuccess:false) → interceptor reject → mutation vào **`onError`** → `handleErrorApi({error})` toast (giống 100% các hook trong `useTicketChatActions.ts` hiện có). **Bỏ hoàn toàn** logic "check `res.data.isSuccess` trong `onSuccess`". `onSuccess` chỉ chạy khi `isSuccess:true` → `res.data.data` chắc chắn có → **không có** nguy cơ suggestion rỗng. (GH-88 áp cho export-PDF bên dưới, không phải cho các hook JSON này.)
- **Export PDF** — dùng lại **pattern binary có sẵn** (đã verify), không tự chế: `responseType:'arraybuffer'` như `file-storage.service.downloadFile` → `new Uint8Array(res.data as ArrayBuffer)` → `File(Paths.cache,'ticket-{id}-chats.pdf').write(bytes)` như `useLocalAudioUri.ts:26-29` → `Sharing.shareAsync(uri,{mimeType:'application/pdf',UTI:'com.adobe.pdf'})` như `useExportMyData`. **[GH-88] Guard `!res.data || byteLength===0`** trước khi ghi/share — vì arraybuffer bỏ qua check `isSuccess` của interceptor (res.data là ArrayBuffer, `.isSuccess` undefined → không bị reject) nên phải tự guard rỗng, không báo "đã tải" giả. `404` (không có chat) → rơi vào nhánh `err` (status 404) → `onError` Alert. `Sharing.isAvailableAsync()` false → Alert.
- **Pin/Unpin**: mutation toggle theo `comment.isPinned`; `onSuccess` invalidate `QUERY_KEY.tickets.chats(ticketId)`. **[#7 verify]** `TicketChatsQueryHandler:159-161` project **cả 3** `IsPinned/PinnedAt/PinnedByUserId` trong GET /chats list → mobile passthrough, chỉ thêm field vào `TicketCommentDTO`. **Lưu ý ordering**: BE `TicketChatsQueryHandler:132` `OrderByDescending(IsPinned)` → **pin làm comment nhảy lên đầu list** (BE-driven); mobile render as-is, không tự sort — implementer đừng ngạc nhiên khi test. Comment mới từ realtime `ChatAdded` không kèm `isPinned` → `undefined` = chưa pin (đúng). Invalidate infinite query = refetch mọi trang đã load — chấp nhận được vì pin tần suất thấp.
- **[#5] ChatBubble menu**: theo đúng pattern optional hiện có (`onEdit?/canEdit`) — thêm `canPin?/onPin?/onUnpin?/isPinned?`, render có điều kiện `canPin && …`, và **bắt buộc** cộng `Number(canPin)` vào `rowCount` (nếu quên → popup lệch/cắt item).
- **Dashboard**: `useStaffDashboardStats` (staleTime 60s) → `StaffDashboardStats` vẽ **thuần react-native-svg**: gauge = `<Path>` arc theo `compliancePercent`; donut = `<Circle strokeDasharray>` cho `countByStatus`/`slaRisk`; bar = `<Rect>` cho `createdTrend7Days`. Đọc `countByStatus[k] ?? 0`. Guard `data == null` → skeleton; list ticket độc lập.
  - **[LẦN 4 #1] TUYỆT ĐỐI KHÔNG cài `victory-native`**: `npx expo install victory-native` resolve ra **41.x (XL, cần Skia native → rebuild dev client)** và API là `CartesianChart/Pie` — KHÁC hẳn `VictoryPie/VictoryBar` của bản 36. Không dùng cả hai; chỉ `react-native-svg@15` (đã cài). Nếu sau này Leader muốn victory-native → phải `npm install victory-native@36.9.2` (bản SVG) và viết lại component, KHÔNG `expo install`.
  - **[LẦN 4 tự soi] Tích hợp header vào `dashboard.tsx`**: hiện `filterRow` nằm NGOÀI FlatList và nhánh `isLoading/isError` **thay thế toàn bộ** FlatList. Nếu nhét `StaffDashboardStats` làm `ListHeaderComponent` → KPI **bị ẩn khi list đang load/lỗi**. Giải: đặt `<StaffDashboardStats/>` (có loading/skeleton RIÊNG từ `useStaffDashboardStats`) NGAY DƯỚI `StaffHeader`, TRÊN `filterRow` — luôn hiển thị, độc lập trạng thái list. (KPI + list là 2 query tách biệt.)

## Edge Cases
- **AI rate-limit (Gemini) / lỗi**: 200 `isSuccess:false` **được interceptor reject** → `onError` → `handleErrorApi` toast message BE. KHÔNG cần logic `onSuccess`. (Xem Approach [LẦN 3 #1].)
- **Pin đủ 3 / đã pin** & **Unpin khi chưa pin** (`400`): interceptor reject → `onError` → `handleErrorApi` toast message BE.
- **Export `404`** (không có chat): Alert "Chưa có nội dung để xuất PDF". `Sharing.isAvailableAsync()` false → Alert "Thiết bị không hỗ trợ chia sẻ".
- **Dashboard data null/lỗi**: skeleton/placeholder, không crash; list ticket vẫn chạy.
- **countByStatus thiếu key** (phòng hờ dù BE zero-fill): FE default `?? 0` khi vẽ.
- **Ticket đã đóng**: BE chặn pin/suggest; mobile ẩn/disable toolbar + menu ghim theo biến **`ticketClosed`** có sẵn (`[id].tsx:198`, 4 status `Resolved/ClosedPendingRate/Closed/ClosedRejected`) — **KHÔNG** hardcode `status === 'Closed'` (sẽ cho pin/AI trên ticket thực chất đã kết thúc).
- **[#3] Dashboard lệch số**: tab counts đọc từ `stats.countByStatus` (server) thay vì `useStaffTickets` cap-100 → không còn 2 nguồn số liệu mâu thuẫn.
- **Isolation**: `ChatAiToolbar` đặt ở `features/tickets/components` nhưng CHỈ import trong `(staff)/tickets/[id].tsx` — customer screen không nhận props → không leak.

## Acceptance Criteria
- [ ] Staff dashboard hiện KPI (đang phụ trách / sắp breach / quá hạn / đã xử lý) đúng số từ endpoint, + gauge SLA %, + donut trạng thái, + donut rủi ro SLA, + bar 7 ngày (react-native-svg, không package mới).
- [ ] Long-press bubble có "Ghim/Bỏ ghim"; ghim OK → badge; ghim quá 3 → toast lỗi BE.
- [ ] Nút Export PDF mở share sheet với file `ticket-{ticketId}-chats.pdf` mở được; ticket rỗng → Alert.
- [ ] Suggest trả 3 gợi ý (intent string), chạm 1 gợi ý → chèn vào ô soạn reply.
- [ ] Summarize hiện modal 5 dòng; Sentiment hiện badge (score + label).
- [ ] AI rate-limit → Alert message, KHÔNG báo thành công giả.
- [ ] `npx tsc --noEmit` PASS + `npx expo lint` 0 warning + `expo start` build sạch (regenerate `.expo/types` nếu route đổi — ở đây không thêm route).

## Steps
- [x] Bước 1 — **Types + Enum**: `chat.enum.ts` (ChatAiIntentEnum); `StaffTicketDashboardStatsDto` + nested (staff.types.ts); `ChatSuggest/Summarize/SentimentCheck` + `ChatSentimentLabel` (chat-actions.types.ts); pin fields (ticket.types.ts). — 2026-07-08
- [x] Bước 2 — **Endpoints + queryKeys**: +6 path, +`dashboardStats()` key. — 2026-07-08
- [x] Bước 3 — **Services**: `staffTicket.getDashboardStats`; `ticketChatActionsService.{suggest,summarize,sentimentCheck,pin,unpin,exportPdf}`. — 2026-07-08
- [x] Bước 4 — **Hooks**: `useStaffDashboardStats`; `useSuggestChat/useSummarizeThread/useSentimentCheck/usePinChat/useUnpinChat/useExportChatPdf`. Tất cả hook JSON chỉ cần `onError: handleErrorApi` (interceptor tự reject isSuccess:false — KHÔNG check `onSuccess`); riêng `useExportChatPdf` guard `!res.data` (arraybuffer). — 2026-07-08
- [x] Bước 5 — **Dashboard UI**: chart primitives (Donut/Bar/Gauge, react-native-svg) gộp trong `StaffDashboardStats.tsx` (không tách charts/ folder — surgical hơn) → render trên `filterRow` trong `dashboard.tsx`; tab counts từ `stats.countByStatus`. — 2026-07-08
- [x] Bước 6 — **Chat UI**: pin menu + badge (ChatBubble), pass-through (CommentThread), `ChatAiToolbar` → wire `(staff)/tickets/[id].tsx` (toolbar, pin, export, chèn suggestion). — 2026-07-08
- [x] Bước 7 — **Gate**: `npx tsc --noEmit` **PASS** (No errors); `npx expo lint` **0 errors** (67 warning đều pre-existing enum `no-redeclare`, KHÔNG trong file mới — `chat.enum.ts` đã eslint-disable). — 2026-07-08

## Nguồn contract đã verify (không suy đoán)
| Contract | Source thật đã đọc |
|---|---|
| `StaffTicketDashboardStatsDto` | BE `.../DTOs/Response/Tickets/StaffTicketDashboardStatsDto.cs` + web `frontend/src/shared/types/dashboardStats.types.ts §B` (khớp) |
| `intent` = string | web `frontend/src/shared/enums/chat.enum.ts` (string) + BE `Program.cs` L22 `JsonStringEnumConverter` |
| `ChatAiIntentEnum` values | BE `.../Domain/Enums/ChatAiIntentEnum.cs` (RequestInfo=1…FollowUp=4) |
| `ChatSuggestDTO/ChatSummarizeDTO/ChatSentimentCheckDTO` | BE `.../DTOs/Response/Chats/*.cs` + web `chat.types.ts` (khớp) |
| pin → `TicketActionResponse`, routes | BE `TicketChatsController.cs` L541/575/914/934/962/985 |
| dashboard route + Authorize Staff | BE `StaffTicketsController.cs` L16/61 |
| `isPinned/pinnedAt/pinnedByUserId` | BE `.../DTOs/Response/Tickets/TicketChatDTO.cs` L44/48/49 |
| **[#7]** `isPinned` có trong GET /chats **list** | BE `TicketChatsQueryHandler.cs` (backer của `[HttpGet]` GetChats) — project `IsPinned` ✅; `ChatAddCommandHandler`/realtime `ChatAdded` KHÔNG kèm (chat mới = chưa pin) |
| **[#3]** dashboard.tsx đếm client cap-100 | mobile `app/(staff)/(tabs)/dashboard.tsx` L27 `useStaffTickets({PageSize:100})` + counts client-side |
| **[#5]** menu popup formula | mobile `ChatBubble.tsx` L219 `Number(canEdit)+Number(canTranslate)+Number(canDelete)` |
| **[#6]** `ticketClosed` thật (4 status) | mobile `app/(staff)/tickets/[id].tsx` L198 |
| **[L3#1]** interceptor reject 200+isSuccess:false | mobile `src/lib/axios.ts` L143-153 (`EntityError`/`HttpError`) → dùng `onError` |
| **[L3#2]** binary pattern (arraybuffer→Uint8Array→write→share) | mobile `file-storage.service.downloadFile` + `useLocalAudioUri.ts:26-29` + `useExportMyData` |
| **[#7 full]** list project cả 3 pin field + order pinned-first | BE `TicketChatsQueryHandler.cs` L159-161 (`IsPinned/PinnedAt/PinnedByUserId`), L132 `OrderByDescending(IsPinned)` |
| export-pdf File + filename + 404 | BE `TicketChatsController.cs` L934–955 |
| RN 0.81 / React 19 / New Arch / svg@15, no Skia | mobile `package.json` + `app.json` |

## Câu hỏi đã giải đáp
1. **Độ sâu chart dashboard?** → Full charts (gauge + 2 donut + bar 7 ngày) NHƯNG vẽ bằng **react-native-svg đã cài** — sau khi đọc code phát hiện victory-native hiện tại = Skia = phải rebuild dev client (New Arch bật). Chọn custom svg: không package mới, không rebuild, đúng rule mobile.
2. **Feature chat nào?** → **Cả 5**: Pin/Unpin, Export PDF, AI Suggest, AI Summarize, AI Sentiment-check.
3. **intent string vs int** (bạn nêu mâu thuẫn memory) → **string**, đã chứng minh bằng web source + BE JsonStringEnumConverter; memory "request=int" chỉ cho query-filter.
4. DTO shapes → verify khớp 100% với BE + web, không còn suy đoán.
5. **[#3] Dashboard 2 nguồn số liệu** → tab counts đổi sang `stats.countByStatus` (single source), diệt luôn bug cap-100 ở filter tab.
6. **[#5] ChatActionMenu formula** → thêm props pin vào cả 2 interface + cộng `Number(canPin)` vào `rowCount` (ghi rõ trong Files/Approach).
7. **[#6] `=== 'Closed'` thô** → tái dùng `ticketClosed` (4 status) có sẵn, không hardcode.
8. **[#7] isPinned trong list** → xác nhận `TicketChatsQueryHandler` project cả 3 field + order pinned-first; passthrough đủ.
9. **[LẦN 3 #1] AI onSuccess-check SAI** → `axios.ts:143-153` interceptor **tự reject** 200+isSuccess:false → dùng `onError`+`handleErrorApi` (giống hook chat hiện có). Bỏ hẳn logic `onSuccess` check + nỗi lo "suggestion rỗng" (không tồn tại theo cơ chế này). GH-88 chỉ áp cho export-PDF (arraybuffer bỏ qua interceptor → tự guard `!data`).
10. **[LẦN 3 #2] Export PDF** → copy đúng `downloadFile` + `useLocalAudioUri` + `useExportMyData` pattern, không tự chế.
11. **[LẦN 4 #1] victory-native 41 vs 36** → plan **không dùng victory-native** (chỉ react-native-svg); thêm guard cấm `expo install victory-native` (ra 41-Skia, API `CartesianChart` ≠ `VictoryPie`). Trap đã tránh từ đầu, nay ghi tường minh.
12. **[LẦN 4 tự soi] Dashboard header** → đặt `StaffDashboardStats` trên `filterRow` (không `ListHeaderComponent`) để không bị ẩn khi list load/lỗi.
13. **[LẦN 4 #2] Badge pinned** → mirror `internalBadge` (ChatBubble.tsx:400-405) — trivial.
