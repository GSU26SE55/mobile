## BÁO CÁO CODE REVIEW — feat/GH-67-staff-chat-dashboard-api — 2026-07-08
### Scope: FE (Mobile — React Native / Expo)
### Effort: Deep (18 file GH-67, cross-component chat + dashboard)

### TÓM TẮT
Implement 6 endpoint Staff-only (dashboard stats + chat pin/suggest/summarize/sentiment/export-pdf) bám sát plan đã qua 4 vòng review. Contract khớp BE source, `tsc --noEmit` sạch trên cây đã merge GH-68, feature isolation OK. **PASS** với vài warning nhỏ (dead export, UX chiều cao dashboard, git-bundling).

### PHÂN TÍCH

#### ✅ Pass
- **Architecture**: API qua `services/` → hook TanStack Query → component; không fetch trực tiếp, không tạo axios instance mới. `staffTicket.getDashboardStats`, `ticketChatActionsService.{pin,unpin,suggest,summarize,sentimentCheck,exportPdf}` đúng layer.
- **Query keys**: dùng `QUERY_KEY.staffTickets.dashboardStats()` / `QUERY_KEY.tickets.chats()` factory — không inline array. Invalidate pin dùng factory.
- **Error handling**: mọi mutation `onError: (error) => handleErrorApi({ error })`. AI 200+isSuccess:false được `axios.ts:143-153` interceptor reject → onError (đúng, không check onSuccess thừa). `useExportChatPdf` guard `!buffer || byteLength===0` + `Sharing.isAvailableAsync()` (chống báo "đã tải" giả — GH-88).
- **Contract**: `intent` gửi STRING (chat.enum.ts), khớp web + BE `JsonStringEnumConverter`. DTO `StaffTicketDashboardStatsDto`/`ChatSuggest/Summarize/SentimentCheck` khớp BE. `TicketCommentDTO` +`isPinned/pinnedAt/pinnedByUserId` — BE `TicketChatsQueryHandler` project cả 3 trong list.
- **Chat pin (post-merge GH-68)**: `rowCount` menu = `Number(canEdit)+Number(canPin)+Number(canDownload)+Number(canTranslate)+Number(canDelete)` — công thức đã cập nhật đúng, không lệch popup. `canShowActions` gồm `canPin`. Badge "Đã ghim" mirror `internalBadge`.
- **ticketClosed**: pin + ChatAiToolbar dùng biến `ticketClosed` 4-state có sẵn (`[id].tsx:198`), KHÔNG hardcode `=== 'Closed'`.
- **Dashboard single-source**: tab counts đọc từ `stats.countByStatus` (server) thay client-count cap-100 → diệt bug lệch số; list vẫn `useStaffTickets`; 2 hook dùng chung cache (dedup).
- **Isolation**: `ChatAiToolbar` chỉ import trong `(staff)/tickets/[id].tsx`; customer screen KHÔNG có pin/AI (verified grep). `canPin = !ticketClosed && !!onPin && !!onUnpin` — customer không truyền → menu ghim ẩn.
- **Chart**: thuần `react-native-svg` (đã cài), KHÔNG victory-native/Skia → không rebuild dev client. Guard `data == null` → skeleton/null, không chặn list.
- **Chất lượng**: component PascalCase, không hardcode URL (qua `ENDPOINTS`), không `console.log` trong file mới.

#### 🟡 Warning
1. `src/features/tickets/types/chat-actions.types.ts:35` — `ChatSuggestPayload` được export nhưng **không dùng** (service `suggest` nhận `intent` inline). → Xóa để tránh dead code, hoặc dùng làm kiểu tham số `suggest(payload: ChatSuggestPayload)`.
2. `app/(staff)/(tabs)/dashboard.tsx:60` — `StaffDashboardStats` đặt **cố định** trên `filterRow`, chiều cao lớn (KPI + gauge + 2 donut + bar). Trên máy nhỏ ép vùng list ticket còn hẹp. → Cân nhắc chuyển stats + filterRow thành `ListHeaderComponent` (và bỏ early-return isLoading/isError để header không bị ẩn) cho cả màn cuộn mượt. Không chặn merge.
3. `src/lib/endpoints.ts` (STAFF_TICKETS) — dòng trống thừa sau `DASHBOARD_STATS` (cosmetic).

### RỦI RO & LƯU Ý
- **Git-bundling (không phải lỗi code):** commit `f0ee6db` gộp GH-67 + work voice-audio-bubble (TypingIndicator/VoiceMessageBubble/useAudioAttachment/useLocalAudioUri/useVoiceRecorder, customer `[id].tsx`) + docs/api-*.md. Nếu tạo PR GH-67 từ branch này, PR sẽ chứa cả work ngoài scope. → Khi ship, lưu ý phạm vi PR / tách commit nếu team yêu cầu 1-issue-1-PR sạch.
- **Pin reorder (BE-driven):** `TicketChatsQueryHandler:132 OrderByDescending(IsPinned)` → ghim làm comment nhảy lên đầu list. Đây là hành vi BE, mobile render as-is — cần verify UX khi test (không phải bug).
- **`expo lint`**: 0 error, 67 warning đều pre-existing (`no-redeclare` enum pattern toàn repo), KHÔNG trong file GH-67 mới.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
Không có Critical. 3 warning nhỏ (1 dead export, 1 UX chiều cao dashboard, 1 cosmetic) không chặn merge — có thể xử lý ở polish sau hoặc trong `/kltn-test`. Code khớp plan, contract verified từ BE source, tsc sạch, isolation OK.
