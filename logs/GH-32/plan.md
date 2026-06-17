# Plan — GH-32: [Mobile] Knowledge Base (Wiki) — Customer & Staff

## Metadata
- **Status:** REVIEWING | **Role:** Mobile (FE) | **Ngày:** 2026-06-17
- **Issue:** #32 — https://github.com/GSU26SE55/mobile/issues/32
- **Sprint:** Sprint 3 (due 2026-06-27) — chuyển từ Sprint 1 (đã quá hạn) sang sprint đang chạy

## Mục tiêu
Thêm tính năng Wiki / Knowledge Base (chỉ ĐỌC) cho mobile, dùng chung Customer + Staff:
tra cứu/tìm bài viết tự khắc phục (list + search + filter category), đọc chi tiết, đánh giá hữu ích,
gợi ý bài viết liên quan theo ticket ở màn TicketDetail, và self-help theo category trong luồng tạo ticket.

> **Contract đã verify trực tiếp từ backend `TicketService`** (controller + query + handler + mapper), không dựa giả định doc. Chi tiết khác biệt: mục "Contract corrections" cuối plan.

## Scope
**Trong scope (4 endpoint Nhóm 8 — đều `[Authorize]`, mọi role login):**
- `GET /api/knowledge-base` — list + search (`Q`/`Category`/`Tag`) + phân trang
- `GET /api/knowledge-base/{id}` — chi tiết bài viết
- `GET /api/knowledge-base/suggest?TicketId=` — gợi ý bài liên quan **theo ticket đã tồn tại** → dùng ở TicketDetail
- `POST /api/knowledge-base/{id}/helpful` — đánh giá hữu ích (BE không dedup → FE chặn double-tap)
- Entry point: **tab "Wiki" mới** cho customer tabs + staff tabs
- Staff dùng chung feature ở chế độ **chỉ đọc** (BE tự lọc role)

**Ngoài scope:**
- Staff authoring (Nhóm 9): create/update/versions/compare/copy-template
- Admin/Manager workflow (Nhóm 10): approve/reject/publish/archive/rollback
- Versioning UI, diff, KbReference linking, filter theo `Status` (chỉ ý nghĩa với internal role)

## Endpoints
| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/knowledge-base` | query: `Q?: string`, `Category?: int`, `Tag?: string`, `PageNumber`, `PageSize` | `CommonResponse<PaginationResponse<KbArticleListItemDto>>` |
| GET | `/api/knowledge-base/{id}` | path: `id` | `CommonResponse<KbArticleDto>` (401 / 404) |
| GET | `/api/knowledge-base/suggest` | query: `TicketId: guid` (required) | `CommonResponse<KbArticleSuggestDto[]>` (top 5; 404 nếu ticket không thấy) |
| POST | `/api/knowledge-base/{id}/helpful` | path: `id`, body none | `CommonResponse<object>` (401 / 404) |

> **Quan trọng — enum direction bất đối xứng:** response trả enum **string** (`"Charging"`, `"Published"` — `JsonStringEnumConverter`), nhưng query filter `Category` nhận **int** (`?Category=1`). FE cần map `TicketCategoryEnum` (string) → int khi gửi filter.

## Enums
| Enum | File nguồn | Ghi chú |
|------|-----------|---------|
| KbArticleStatusEnum | `features/knowledge-base/enums/knowledge-base.enum.ts` (create) | Draft=1, PendingReview=2, Published=3, Archived=4 — chỉ 1 feature dùng |
| TicketCategoryEnum | `shared/enums/ticket.enum.ts` (đã có, string `as const`) | Dùng cho filter + hiển thị badge |
| CATEGORY_TO_INT (map) | `features/knowledge-base/types/knowledge-base.types.ts` (create) | Charging=1, Overheat=2, NoPower=3, Performance=4, Other=5, Repair=6 — để gửi `Category` int |

## Types (`features/knowledge-base/types/knowledge-base.types.ts`)
```ts
// List item — KHÔNG có tags; CÓ reviewRequired + createdAt
interface KbArticleListItemDto {
  id: string; code: string; title: string;
  category: TicketCategoryEnum; status: KbArticleStatusEnum;
  viewCount: number; helpfulCount: number; reviewRequired: boolean; createdAt: string;
}
// Detail — shape riêng (KHÔNG extends ListItem vì list thiếu tags & field khác)
interface KbArticleDto {
  id: string; code: string; category: TicketCategoryEnum; title: string;
  symptoms: string; diagnosisSteps: string; solutionSteps: string;
  recommendedParts: string[] | null; tags: string[];
  status: KbArticleStatusEnum; isInternalOnly: boolean; version: number;
  viewCount: number; helpfulCount: number; reviewRequired: boolean;
  pendingReviewBy: string | null; managerRejectReason: string | null;
  createdByUserId: string; createdAt: string; updatedAt: string | null;
}
// Suggest — KHÔNG có category; CÓ symptoms + counts
interface KbArticleSuggestDto {
  id: string; code: string; title: string; symptoms: string;
  helpfulCount: number; viewCount: number;
}
interface KbListParams { Q?: string; Category?: number; Tag?: string; PageNumber?: number; PageSize?: number; }
```

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/endpoints.ts` | modify | Thêm block `KNOWLEDGE_BASE` { LIST, DETAIL(id), SUGGEST, HELPFUL(id) } |
| `src/lib/queryKeys.ts` | modify | `KEY.knowledgeBase` + `QUERY_KEY.knowledgeBase.{list,detail,suggest}` |
| `src/features/knowledge-base/enums/knowledge-base.enum.ts` | create | KbArticleStatusEnum (`as const`) |
| `src/features/knowledge-base/types/knowledge-base.types.ts` | create | DTOs + KbListParams + CATEGORY_TO_INT, re-export enum |
| `src/features/knowledge-base/services/knowledge-base.service.ts` | create | getList, getDetail, suggest, markHelpful — `axiosInstance` |
| `src/features/knowledge-base/hooks/useKbArticles.ts` | create | useQuery list/search |
| `src/features/knowledge-base/hooks/useKbArticle.ts` | create | useQuery detail (enabled khi có id) |
| `src/features/knowledge-base/hooks/useKbSuggest.ts` | create | useQuery suggest theo ticketId (enabled khi có ticketId) |
| `src/features/knowledge-base/hooks/useMarkHelpful.ts` | create | useMutation + invalidate detail; onError → handleErrorApi |
| `src/features/knowledge-base/components/KbArticleCard.tsx` | create | Item list (title, category badge, view/helpful count) |
| `src/features/knowledge-base/components/KbSuggestList.tsx` | create | List gợi ý (dùng ở TicketDetail + self-help stepper) |
| `src/features/knowledge-base/screens/KbListScreen.tsx` | create | Màn list+search dùng chung 2 role (presentational) |
| `src/features/knowledge-base/screens/KbDetailScreen.tsx` | create | Màn detail dùng chung 2 role |
| `app/(customer)/(tabs)/wiki.tsx` | create | Wrapper `<KbListScreen role="customer" />` |
| `app/(customer)/wiki/[id].tsx` | create | Wrapper `<KbDetailScreen />` |
| `app/(staff)/(tabs)/wiki.tsx` | create | Wrapper `<KbListScreen role="staff" />` |
| `app/(staff)/wiki/[id].tsx` | create | Wrapper `<KbDetailScreen />` |
| `app/(customer)/(tabs)/_layout.tsx` | modify | Thêm `Tabs.Screen name="wiki"` + icon (book) |
| `app/(staff)/(tabs)/_layout.tsx` | modify | Thêm `Tabs.Screen name="wiki"` + icon (book) |
| `app/(customer)/tickets/[id].tsx` | modify | Thêm section "Bài viết liên quan" → `useKbSuggest(ticketId)` + `KbSuggestList` |
| `src/features/tickets/components/CreateTicketStepper.tsx` | modify | Sau khi chọn Category → `useKbArticles({ Category: <int>, PageSize: 3 })` self-help, tap mở `wiki/[id]` |

## Approach
- 1 feature module `src/features/knowledge-base/` dùng chung; screen là presentational, route file mỗi role group chỉ wrapper mỏng (mirror pattern `alerts`).
- Service gọi `axiosInstance` qua `ENDPOINTS.KNOWLEDGE_BASE`; hook trả `res.data.data` đúng pattern `useTickets`. Token tự gắn (list `[Authorize]`).
- **Filter Category gửi int**: dùng `CATEGORY_TO_INT[selectedCategory]` khi build params; response enum đọc string trực tiếp.
- Search: state `Q` debounce ~400ms (inline `setTimeout`, không thêm package). Filter category bằng chip dùng `TicketCategoryEnum`.
- **suggest đúng contract**: chỉ gọi khi đã có `ticketId` → dùng ở TicketDetail ("Bài viết liên quan"). Trong CreateTicketStepper (ticket chưa tồn tại) KHÔNG gọi suggest — thay bằng `GET /knowledge-base?Category=<int>` để self-help.
- helpful: onSuccess invalidate `QUERY_KEY.knowledgeBase.detail(id)` + toast; onError → `handleErrorApi({ error })`; disable nút sau call (BE không dedup).
- Cache: list `staleTime` mặc định; detail `staleTime` 10' (ít đổi); suggest `staleTime` mặc định, `enabled: !!ticketId`.

## Edge Cases
- List rỗng / search 0 kết quả → EmptyState.
- Detail `404` (chưa Published / internal / không tồn tại) → màn báo lỗi + nút quay lại (Customer bị BE chặn → 404).
- `401` → axios interceptor tự refresh/logout (đã có sẵn), không xử lý riêng.
- suggest `404` (ticket không thấy) hoặc rỗng → ẩn section "Bài viết liên quan", không lỗi cứng.
- helpful double tap → disable nút local sau khi gọi tránh tăng count nhiều lần; lỗi mạng → toast cho thử lại.
- `recommendedParts = null` → ẩn section linh kiện trong detail.
- Mất mạng/isError ở list → hiện lỗi + RefreshControl retry (pattern ticket list).

## Acceptance Criteria
- [ ] Customer & Staff đều có tab "Wiki" mở màn list KB.
- [ ] List hiển thị bài (Customer chỉ thấy Published non-internal), search `Q` + filter `Category` (gửi int) hoạt động, có phân trang/refresh.
- [ ] Chi tiết hiển thị symptoms / diagnosisSteps / solutionSteps / tags / recommendedParts (ẩn nếu null) / view & helpful count.
- [ ] Nút "Hữu ích" gọi `POST .../helpful` thành công, toast, không spam được (disable sau call).
- [ ] TicketDetail (Customer) hiển thị "Bài viết liên quan" từ `suggest?TicketId=`; rỗng/404 → ẩn section, không crash.
- [ ] CreateTicketStepper: sau chọn Category hiện vài bài self-help (`?Category=<int>`), tap mở được bài; không chặn tạo ticket.
- [ ] `npx tsc --noEmit` PASS; không gọi API trực tiếp trong component (qua service → hook).

## Steps
- [x] Bước 1: Enums + Types (KbArticleStatusEnum, 3 DTO, KbListParams, CATEGORY_TO_INT) — 2026-06-17
- [x] Bước 2: endpoints.ts + queryKeys.ts — 2026-06-17
- [x] Bước 3: Service (getList, getDetail, suggest, markHelpful) — 2026-06-17
- [x] Bước 4: Hooks (useKbArticles, useKbArticle, useKbSuggest, useMarkHelpful) — 2026-06-17
- [x] Bước 5: Components (KbArticleCard, KbSuggestList) + Screens (KbListScreen, KbDetailScreen) — 2026-06-17
- [x] Bước 6: Route files 2 role + thêm tab "Wiki" vào 2 `_layout.tsx` (width 230→300 cho 4 tab) — 2026-06-17
- [x] Bước 7: Wire suggest vào TicketDetail + self-help (Category) vào CreateTicketStepper — 2026-06-17
- [x] Bước 8: `npx tsc --noEmit` → PASS (eslint: chỉ warning no-redeclare giống pattern enum hiện có) — 2026-06-17

## Contract corrections (so với doc cũ — đã verify backend & doc đã được fix khớp)
| # | Doc cũ / hiểu sai ban đầu | Backend thật |
|---|---|---|
| 1 | List anonymous | `[Authorize]` mọi role, 401 nếu thiếu token |
| 2 | `Keyword`, `Tags[]`, `Category` string | `Q`, `Tag` (1 string), `Category`/`Status` **int** |
| 3 | List item có `tags` | **không tags**; có `reviewRequired`, `createdAt` |
| 4 | `KbArticleDto = ListItem + vài field` | shape riêng đầy đủ (version, counts, pendingReviewBy, managerRejectReason, createdByUserId, createdAt, updatedAt…) |
| 5 | `KbArticleSuggestDto` có `category` | **không category**; có `symptoms`, `helpfulCount`, `viewCount` |
| 6 | helpful optional + dedup UserId | `[Authorize]`, **không dedup** — mỗi call +1 |
| 7 | suggest = text khi gõ → dùng trong CreateTicket | suggest = **TicketId** → chỉ dùng được ở TicketDetail (ticket đã tồn tại); self-help lúc tạo dùng list `?Category=` |

## Câu hỏi đã giải đáp
- **Staff scope:** Chỉ đọc — không authoring trên mobile.
- **Suggest:** Endpoint nhận `TicketId` → đặt ở TicketDetail ("Bài viết liên quan"). Ý định self-help lúc tạo ticket giữ lại qua list `?Category=<int>` trong CreateTicketStepper.
- **Navigation:** Tab "Wiki" mới cho cả 2 role; list → detail là stack screens.
- **Issue split:** Giữ toàn bộ trong 1 issue #32.

## Ghi chú Sprint ⚠️
Hôm nay 2026-06-17 đã quá due Sprint 1 (2026-05-30). Trước khi finalize sẽ kiểm tra milestone đang mở có due ≥ hôm nay và gán #32 vào sprint đúng để tránh lệch Sprint Board (hoặc giữ Sprint 1 nếu Leader chủ ý).
