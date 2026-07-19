# Plan — GH-78: Blog read-only (Customer & Staff) + fix route thiếu khai báo

## Metadata
- **Status:** REVIEWING | **Role:** Mobile | **Ngày:** 2026-07-19
- **Issue:** #78 — https://github.com/GSU26SE55/mobile/issues/78
- **Sprint:** Sprint 6 (due 2026-08-08)
- **Dev:** Trần Minh Trí (SE183109)

## ⚠️ Blocker — không code được ngay

Blog BE **chưa merge vào `dev`**. Chỉ tồn tại trên branch `feat/GH-671-blog` (đi trước `dev` 17 commit); `origin/dev` không có file Blog nào.

Phải chờ branch đó merge rồi mới implement. Trước khi bắt đầu, verify lại contract vì hành vi `RequirePublished` (bài không Published → 404) lúc đọc còn nằm trong working tree **chưa commit**, có thể đổi.

## Mục tiêu

Thêm feature `blog/` read-only cho Mobile: Customer và Staff đọc bài Blog đã `Published`. Kèm fix 4 route đang tồn tại nhưng thiếu khai báo trong `(staff)/_layout.tsx`.

## Scope

**Trong scope:**
- `src/features/blog/` — service, types, hooks, components (khuôn từ feature `kb/`)
- Screen `(customer)/blog/{index,[id]}` + `(staff)/blog/{index,[id]}`
- Render `contentHtml` ở màn detail bằng `react-native-render-html`
- Khai báo route thiếu trong `(staff)/_layout.tsx`: `kb/index`, `kb/[id]`, `maintenance-history`, `sites/[id]` + `blog/index`, `blog/[id]`
- Khai báo `blog/index`, `blog/[id]` trong `(customer)/_layout.tsx`

**Ngoài scope:**
- Staff tạo/sửa bài — cần editor WebView + BE bổ sung permission `blog.*` → issue riêng
- Publish / archive / delete / `generate-from-kb` — `AdminBlogController`, gate `Manager,Admin`, Staff gọi sẽ 403
- Version history, compare, template — chỉ có ở Web
- Không đụng feature `kb/` hiện có

## Contract BE (đã verify)

| Endpoint | Method | Auth | Ghi chú |
|---|---|---|---|
| `/api/blog` | GET | `[Authorize]` mọi role | Controller **ghi đè** `Status = Published` |
| `/api/blog/{id}` | GET | `[Authorize]` mọi role | Bài không Published → **404** |

**Query params** — dùng `PageNumber`/`PageSize` (đã chuẩn hoá ở BE cùng ngày, trước đó là `Page`):

| Param | Type | Ghi chú |
|---|---|---|
| `PageNumber` | `int` | Default 1 |
| `PageSize` | `int` | Default 10, cap 100 |
| `Origin` | `string?` | `Manual` \| `AiGeneratedFromKb` — **không** bị ghi đè, dùng được |
| ~~`Status`~~ | — | Bị controller ghi đè, **không gửi** |

> Response `PaginationResponse` trả `PageNumber`/`PageSize`/`TotalItems`/`HasNextPage` — trùng tên với request sau khi chuẩn hoá.

## Enums

| Enum | File nguồn | Giá trị |
|---|---|---|
| `BlogPostStatusEnum` | `src/features/blog/enums/blog.enum.ts` (tạo mới) | `Generating` \| `GenerationFailed` \| `Draft` \| `Published` \| `Archived` |
| `BlogPostOriginEnum` | cùng file | `Manual` \| `AiGeneratedFromKb` |

> BE dùng `JsonStringEnumConverter` → response trả **chuỗi**. Wire value là 1..5 và 1..2 nhưng **không mirror số** — dùng `as const` chuỗi như `KbArticleStatusEnum`. Đặc biệt `Published = 4`, đừng hardcode số ở đâu cả.

## Types

`src/features/blog/types/blog.types.ts` — khai báo đầy đủ từng interface, **không dùng `extends`**, re-export enum ở đầu file (theo đúng convention `kb.types.ts`).

```ts
import type { BlogPostStatusEnum, BlogPostOriginEnum } from '../enums/blog.enum';
export { BlogPostStatusEnum, BlogPostOriginEnum } from '../enums/blog.enum';

// ← BlogPostListItemDTO. KHÔNG có contentHtml.
export interface BlogPostSummaryDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: BlogPostStatusEnum;
  origin: BlogPostOriginEnum;
  authorUserId: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string | null;
}

// ← BlogPostDTO. Khai lại đủ field, không extends.
export interface BlogPostDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentHtml: string;
  status: BlogPostStatusEnum;
  origin: BlogPostOriginEnum;
  sourceKbArticleId: string | null;
  blogTemplateId: string | null;
  authorUserId: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface BlogListParams {
  pageNumber?: number;
  pageSize?: number;
  origin?: BlogPostOriginEnum;
}
```

> `DateTime`/`DateTime?` của BE → `string` / `string | null` (ISO). `Guid?` → `string | null`.

## Files

| File | Action | Ghi chú |
|---|---|---|
| `src/features/blog/enums/blog.enum.ts` | create | 2 enum `as const` |
| `src/features/blog/types/blog.types.ts` | create | re-export enum |
| `src/features/blog/services/blog.service.ts` | create | `getList`, `getDetail` |
| `src/features/blog/hooks/useBlogList.ts` | create | khuôn `useKbList` |
| `src/features/blog/hooks/useBlogInfiniteList.ts` | create | khuôn `useKbInfiniteList` |
| `src/features/blog/hooks/useBlogDetail.ts` | create | khuôn `useKbDetail` |
| `src/features/blog/components/BlogCard.tsx` | create | khuôn `KbArticleCard` |
| `src/features/blog/components/BlogEmptyState.tsx` | create | khuôn `KbEmptyState` |
| `src/features/blog/components/BlogContent.tsx` | create | wrap `react-native-render-html` + theme |
| `src/lib/endpoints.ts` | modify | thêm `BLOG: { LIST, DETAIL(id) }` |
| `src/lib/queryKeys.ts` | modify | `KEY.blog` + `QUERY_KEY.blog.{list,infinite,detail}` |
| `app/(customer)/blog/index.tsx` | create | list |
| `app/(customer)/blog/[id].tsx` | create | detail |
| `app/(staff)/blog/index.tsx` | create | list |
| `app/(staff)/blog/[id].tsx` | create | detail |
| `app/(customer)/_layout.tsx` | modify | khai báo 2 route blog |
| `app/(staff)/_layout.tsx` | modify | khai báo 2 route blog **+ 4 route đang thiếu** |
| `package.json` | modify | `react-native-render-html` |

## Endpoints

```ts
BLOG: {
  LIST:   '/api/blog',
  DETAIL: (id: string) => `/api/blog/${id}`,
},
```

## Authz

Gate bằng `user.role`, **KHÔNG** dùng `PermissionGuard`.

BE không có permission `blog.*` — `AuthService/.../PermissionCodes.cs` chỉ có `knowledge_base.view`. Truyền `P.` không tồn tại vào `PermissionGuard` sẽ chặn nhầm toàn bộ user. Route group `(customer)`/`(staff)` đã gate role sẵn ở `_layout.tsx`, đủ cho scope này.

## Workflow

**List:**
```
Mount → useBlogInfiniteList({ pageNumber, pageSize: 10 })
  → GET /api/blog?PageNumber=1&PageSize=10
  → render BlogCard (title + summary, KHÔNG render HTML)
  → scroll cuối → hasNextPage ? fetchNextPage()
```

**Detail:**
```
Tap card → router.push(`/blog/${id}`) → useBlogDetail(id)
  → GET /api/blog/{id}
  → 200:  render BlogContent(contentHtml) qua react-native-render-html
  → 404:  bài đã bị archive/gỡ → EmptyState "Bài viết không còn khả dụng" + nút quay lại
```

## Lib mới

`react-native-webview@13.15.0` — RN không có DOM nên Tiptap/DOMPurify/htmldiff-js (Web) không chạy.

> **Đổi hướng sau code review (2026-07-19).** Ban đầu chọn `react-native-render-html`, đã cài rồi gỡ:
> bản mới nhất `6.3.4` (2022, không còn maintain) gán `defaultProps` lên **function component**
> (`TRenderEngineProvider.js:134`, `TNodeChildrenRenderer.js:86`), mà React 19 đã bỏ hẳn API này
> → default bị bỏ qua im lặng ngay ở đường render chính. Peer dep khai `react: "*"` nên npm không cảnh báo.
> `react-native-webview` không dùng `defaultProps` ở đâu cả và là version expo pin sẵn.

Cách dùng an toàn (`BlogContent.tsx`):
- `javaScriptEnabled={false}` — HTML từ BE (kể cả bài AI sinh) không thực thi được gì
- Meta CSP `default-src 'none'; img-src https: data:; style-src 'unsafe-inline'` — chặn script/frame/fetch
- `onShouldStartLoadWithRequest` chặn mọi điều hướng; link `http(s)` mở bằng trình duyệt hệ thống, scheme khác (`javascript:`, `file:`, `intent:`) bị bỏ qua
- WebView **tự cuộn** → không cần inject JS đo chiều cao, và màn detail không bọc `ScrollView`

Chỉ dùng ở `[id].tsx`. Màn list render `<Text>` thường vì `BlogPostListItemDTO` không trả `contentHtml`.

```bash
npx expo install react-native-webview
```

## Steps

- [ ] Bước 0: Xác nhận `feat/GH-671-blog` đã merge vào `dev` + verify lại contract (`RequirePublished`)
      ⚠️ **CHƯA XONG — BỎ QUA theo quyết định Leader (2026-07-19).** `origin/dev` vẫn 0 file Blog, và
      branch `feat/GH-671-blog` **chưa có PR nào**. Code hiện tại chưa gọi thử được API thật.
      Phải verify lại contract trước khi ship, đặc biệt `RequirePublished` (bên BE còn chưa commit).
- [x] Bước 1: Cài `react-native-render-html` — 2026-07-19 (v6.3.4)
- [x] Bước 2: Tạo enums + types — 2026-07-19
- [x] Bước 3: Thêm `ENDPOINTS.BLOG` + `QUERY_KEY.blog` — 2026-07-19
- [x] Bước 4: Tạo service + 3 hook — 2026-07-19
- [x] Bước 5: Tạo components (`BlogCard`, `BlogEmptyState`, `BlogContent`) — 2026-07-19
- [x] Bước 6: Tạo 4 screen (customer + staff) — 2026-07-19
- [x] Bước 7: Khai báo route vào 2 `_layout.tsx` — gồm cả 4 route đang thiếu của staff — 2026-07-19
- [x] Bước 8: Regenerate `.expo/types` (`expo start` rồi dừng) — 2026-07-19
- [x] Bước 9: `npx tsc --noEmit` → PASS — 2026-07-19

## Ghi chú

**eslint gate đang FAIL sẵn trên `dev`** (67 warning, phần lớn `no-redeclare` do chính pattern `as const` mà rule dự án bắt buộc). So với baseline `dev` trước khi nhận lỗi là của ticket này — không sửa trong scope GH-78.
