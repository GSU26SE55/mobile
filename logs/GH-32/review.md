## BÁO CÁO CODE REVIEW — feat/GH-32-knowledge-base-wiki — 2026-06-17
### Scope: FE (Mobile)
### Effort: Deep (nhiều file, cross-feature, route mới)

### TÓM TẮT
Feature Knowledge Base (Wiki) read-only cho Customer + Staff: 4 endpoint (list/detail/suggest/helpful), 1 feature module dùng chung, tab "Wiki" 2 role, tích hợp suggest vào TicketDetail + self-help vào CreateTicketStepper. Code bám đúng pattern hiện có (service → hook → component), `tsc` sạch, lint không lỗi. **Không có Critical.**

### Phạm vi review
Chỉ xét file thuộc GH-32. Các thay đổi `docs/api-*.md` (battery/filestorage/ticket/notification/sms) trong working tree là WIP có sẵn từ trước, **ngoài scope** ticket này.

File trong scope:
- `src/features/knowledge-base/**` (enums, types, service, 4 hooks, 2 components, 2 screens)
- `app/(customer)/(tabs)/wiki.tsx`, `app/(customer)/wiki/[id].tsx`, `app/(staff)/(tabs)/wiki.tsx`, `app/(staff)/wiki/[id].tsx`
- `app/(customer)/(tabs)/_layout.tsx`, `app/(staff)/(tabs)/_layout.tsx` (thêm tab)
- `app/(customer)/tickets/[id].tsx`, `src/features/tickets/components/CreateTicketStepper.tsx` (tích hợp)
- `src/lib/endpoints.ts`, `src/lib/queryKeys.ts`

### PHÂN TÍCH

🔴 Critical: (không có)

🟡 Warning:
- `src/features/knowledge-base/screens/KbDetailScreen.tsx:~64` (handleHelpful) — `setVoted(true)` chạy trước mutation; nếu `markHelpful` lỗi, nút vẫn hiển thị "Cảm ơn phản hồi của bạn" (optimistic không rollback). Gợi ý: reset `voted=false` trong `onError`, hoặc set `voted` trong `onSuccess`. Tác động thấp (BE chỉ +1 count, không phá dữ liệu).
- `src/features/knowledge-base/enums/knowledge-base.enum.ts:10` — warning `@typescript-eslint/no-redeclare`. **Chấp nhận** — giống hệt pattern mọi enum hiện có (`ticket.enum.ts`, `account.enum.ts` đều warn tương tự), đây là convention `as const` object + type alias của codebase.
- `KbListScreen.tsx` — `PageSize: 50` không có "load more"/pagination. Đúng theo plan (giữ đơn giản) nhưng nếu >50 bài Published sẽ chỉ hiện 50 bài đầu. Lưu ý cho tương lai.

✅ Pass:
- **Architecture**: không có business logic trong component; API qua `knowledge-base.service` → hook TanStack Query; file đặt đúng `features/knowledge-base/`; dùng `axiosInstance` chung (không tạo instance mới).
- **Cross-feature import**: `tickets → knowledge-base` (CreateTicketStepper, tickets/[id]) — mobile KHÔNG có rule `no-restricted-imports`, và đã có tiền lệ `tickets → batteries`, `tickets → file-storage`. Module `knowledge-base` không import ngược feature nào. Hợp lệ.
- **Query keys**: dùng `QUERY_KEY.knowledgeBase.{list,detail,suggest}` factory; `invalidateQueries` dùng factory `detail(id)` — không hardcode array/string.
- **Error/empty/loading**: KbListScreen (loading spinner / error + retry / empty state / RefreshControl); KbDetailScreen (loading / error + retry + back / 404 handled). suggest & self-help null-guard đúng (`relatedArticles && length`, `selfHelp?.items`).
- **Mutation**: `useMarkHelpful` có `onError: (error) => handleErrorApi({ error })`, không tự toast trong hook.
- **Enum direction**: filter `Category` gửi int qua `CATEGORY_TO_INT`; response đọc enum string — khớp backend (`JsonStringEnumConverter` + query int).
- **Suggest contract**: gọi đúng `?TicketId=` ở TicketDetail (ticket đã tồn tại); self-help lúc tạo ticket dùng `?Category=<int>` (không gọi suggest sai chỗ).
- **Navigation**: Expo Router `router.push({ pathname, params })` đúng pattern; route `wiki` đã đăng ký, typed-routes regen OK.
- **Auth**: route nằm trong group `(customer)`/`(staff)` đã có guard; endpoint `[Authorize]` token tự gắn. KbDetailScreen dùng chung 2 role — BE tự lọc (Customer chỉ thấy Published non-internal). Không render sensitive data.
- **Code quality**: component PascalCase; không hardcode URL/token (dùng `ENDPOINTS`); không còn `console.log`.
- **Build**: `npx tsc --noEmit` PASS; `eslint` 0 error.

### RỦI RO & LƯU Ý
- Tab bar nới `width` 230→300 để chứa 4 tab — cần kiểm tra bằng mắt trên màn nhỏ (review không chạy device). Sẽ verify ở `/kltn-test`.
- Phải chạy Expo typegen (`expo start`) để regen `.expo/types/router.d.ts` cho route `wiki` — đã thực hiện; máy khác checkout cần chạy lại dev server.
- `docs/api-*.md` trong working tree là WIP ngoài scope — khi ship cần tránh commit nhầm vào PR GH-32.

### KẾT LUẬN
**PASS** — Độ tự tin: Cao.
2 warning đều low-impact (optimistic helpful, enum warning theo convention). Không có Critical. Sẵn sàng `/kltn-test 32`.
